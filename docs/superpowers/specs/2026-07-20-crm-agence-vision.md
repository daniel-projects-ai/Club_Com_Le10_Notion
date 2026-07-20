# CRM Agence Macao — Vision d'ensemble et découpage

**Date :** 2026-07-20
**Porteur :** Daniel Such (Agence Macao)
**Statut :** Vision validée — sert de cadre aux specs 3a, 3b, 3d et au module 4
**Nature :** Document de cadrage, pas une spec d'implémentation

---

## 1. Le déplacement fondateur

Le système actuel part de **l'appel d'offres**. Une opportunité est détectée, on décide d'y répondre, on monte un dossier. Tout découle de là.

Un CRM impose d'inverser : **tout part de l'organisation**. Une collectivité, une entreprise, une association existe indépendamment de la consultation qu'elle publie. L'appel d'offres devient *une* manière parmi d'autres d'entrer en relation avec elle — à côté de la prospection directe, de la recommandation, du réseau.

Conséquence sur le modèle : la table `Acheteurs` envisagée initialement devient **`Organisations`**, caractérisées par leur nature publique ou privée. Les acheteurs publics en sont un cas particulier, pas le modèle de référence.

## 2. La colonne vertébrale : le journal des interactions

Une seule table **`Interactions`** enregistre chaque point de contact : email envoyé, appel passé, rendez-vous tenu, réponse reçue, message LinkedIn, courrier.

Tout s'y branche :
- l'**historique** d'une organisation est son journal ;
- une **campagne** est ce qui *produit* des interactions ;
- une **relance** est une interaction *à venir*.

Sans ce journal, on obtient trois sous-systèmes qui ne se parlent pas et trois endroits où ressaisir la même chose. C'est la pièce structurante du CRM, plus encore que la table Organisations.

## 3. Contraintes assumées dès la conception

### RGPD — intégré au modèle, pas en annexe
La prospection B2B en France repose sur l'intérêt légitime, mais impose : identification claire de l'expéditeur, moyen de refus sur **chaque** message, traçabilité des consentements et des oppositions, registre des traitements. Ces éléments font partie du modèle de données des livraisons 3b et 3d — ils ne peuvent pas être greffés après.

### L'emailing de campagne n'est pas du transactionnel
Resend sert aujourd'hui aux liens de connexion : quelques messages par jour, sans gestion de désinscription ni de réputation d'expéditeur. Une campagne suppose bounces, désabonnements, réchauffement de domaine, suivi de délivrabilité.

**Décision : brancher un outil spécialisé** (Brevo, Lemlist ou équivalent) et garder dans l'intranet le **pilotage et le journal**, plutôt que reconstruire une infrastructure d'envoi.

### LinkedIn n'est pas automatisé
Les conditions d'utilisation de LinkedIn interdisent l'automatisation et les comptes concernés sont restreints. Les touches LinkedIn sont **journalisées manuellement** : l'utilisateur note qu'il a écrit, le système suit la séquence. Choix délibéré de ne pas exposer les comptes de l'agence.

## 4. Découpage en livraisons

| | Livraison | Contenu | Statut |
|---|---|---|---|
| **3a** | **Socle relationnel** | Organisations, interlocuteurs, rattachement aux opportunités, historique calculé | spec rédigée |
| **3b** | **Journal et relances** | Interactions, tâches datées, traçabilité RGPD des oppositions | à concevoir |
| **3d** | **Campagnes multicanales** | Segments, séquences, intégration de l'outil d'emailing, suivi des retours | à concevoir |
| **4** | **Pipeline, devis et facturation** | Devis, montants, probabilité, prévisionnel, factures, marge | à concevoir |

Le pipeline commercial, initialement envisagé comme livraison distincte (3c), **fusionne avec le module 4** : un devis et une facture forment un continuum, les séparer créerait deux endroits pour la même information.

### Ordre et dépendances

**3a → 3b → 3d** est contraint : on ne lance pas de campagne sur des contacts qui n'existent pas, et on n'en mesure pas le retour sans journal. Le module 4 vient ensuite.

Chaque livraison est utilisable seule. Le socle 3a sert dès sa mise en production, indépendamment de la suite.

## 5. Ce que cette vision ne tranche pas

- Le choix précis de l'outil d'emailing (à instruire au moment de 3d, selon tarif et API)
- La question de savoir si les coworkers accèdent à tout ou partie du CRM — tranché à `Macao uniquement` pour 3a, à réexaminer ensuite
- La reprise éventuelle d'un historique commercial antérieur au système
