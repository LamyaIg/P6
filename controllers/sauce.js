const fs = require('fs');

//Import du modéle de la sauce
const Sauce = require('../models/Sauce');

//Création d'une sauce
exports.createSauce = (req, res, next) => {
  const sauceObjet = JSON.parse(req.body.sauce);
  const sauce = new Sauce({
    ...sauceObjet,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce
    .save()
    .then((sauce) => {
      console.log("Creation de sauce : " + sauce)
      res.status(201).json({ sauce });
    })
    .catch((error) => {
      console.log("Erreur creation de sauce : " + error)
      res.status(400).json({
        error: error,
      });
    });
};


//Récuperer une sauce unique par l'id
exports.OneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};




//Modification d'une sauce
exports.update = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  if (req.file)  {
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        if (sauce.userId != req.auth.userId) {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
            .then(() => { res.status(200).json({ message: 'Sauce mise à jour!' }); })
            .catch((error) => { res.status(400).json({ error }); });
        })}
      })
      .catch((error) => { res.status(500).json({ error }); });

  } else {
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Sauce mise à jour!' }))
      .catch((error) => res.status(400).json({ error }));
  }
};


//récuperation de toutes les sauces
exports.list = (req, res, next) => {
  Sauce.find()
  .then((sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};


/*** PERMET LA SUPPRESSION DE "SAUCE" */
exports.deleteSauce = (req, res, next) => {
  // Avant de supprimer l'objet, on va le chercher pour obtenir l'url de l'image et supprimer le fichier image de la base
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({
          message: 'Action non autorisée',
        });
        return;
      }
      // Pour extraire ce fichier, on récupère l'url de la sauce, et on le split autour de la chaine de caractères, donc le nom du fichier
      const filename = sauce.imageUrl.split('/images/')[1];
      // Avec ce nom de fichier, on appelle unlink pour suppr le fichier
      fs.unlink(`images/${filename}`, () => {
        // On supprime le document correspondant dans la base de données
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};


//like ou dislike les sauces
exports.likeSauce = function (req, res, next) {
  Sauce.findOne({ _id: req.params.id })
      .then(function (sauce) {
          switch (req.body.like) {
              //si likes = 1 == j'aime
              case 1:
                  if (!sauce.usersLiked.includes(req.auth.userId) && req.body.like === 1) {
                      Sauce.updateOne({ _id: req.params.id },
                          {
                              $inc: { likes: 1 }, $push: { usersLiked: req.body.userId }
                          })
                          .then(function () {
                              res.status(201).json({ message: "ajout d'un like" });
                          })
                          .catch(function (error) {
                              res.status(400).json({ error: error });
                          });
                  }
                  break;

               //si likes = -1 == j'aime pas                  
              case -1:
                  if (!sauce.usersDisliked.includes(req.auth.userId) && req.body.like === -1) {
                      Sauce.updateOne({ _id: req.params.id },
                          {
                              $inc: { dislikes: 1 }, $push: { usersDisliked: req.body.userId }
                          })
                          .then(function () {
                              res.status(201).json({ message: "ajout d'un dislkike" });
                          })
                          .catch(function (error) {
                              res.status(400).json({ error: error });
                          });
                  }
                  break;

              //si likes = 0 == annulation du like ou dislike
              case 0:
                  if (sauce.usersDisliked.includes(req.body.userId) && req.body.like === 0) {
                      Sauce.updateOne({ _id: req.params.id },
                          {
                              $inc: { dislikes: -1 }, $pull: { usersDisliked: req.body.userId }
                          })
                          .then(function () {
                              res.status(201).json({ message: "annulation du  dislike" });
                          })
                          .catch(function (error) {
                              res.status(400).json({ error: error });
                          });
                  }

                  if (sauce.usersLiked.includes(req.auth.userId) && req.body.like === 0) {
                      Sauce.updateOne({ _id: req.params.id },
                          {
                              $inc: { likes: -1 }, $pull: { usersLiked: req.body.userId }
                          })
                          .then(function () {
                              res.status(201).json({ message: "annulation du like" });
                          })
                          .catch(function (error) {
                              res.status(400).json({ error: error });
                          });
                  }
                  break;

          }
      })
}
