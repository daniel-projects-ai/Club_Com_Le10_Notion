# CRM 3b — Journal des interactions et relances : Conception

**Date :** 2026-07-20
**Porteur :** Daniel Such (Agence Macao)
**Statut :** Conception validée — prête pour le plan d'implémentation
**Cadre :** `2026-07-20-crm-agence-vision.md` — livraison **3b** sur quatre

---

## 1. Cadre

- **Contexte** — La livraison 3a a créé les organisations et leurs interlocuteurs. Il manque la trace de ce qui se passe entre eux : ce qui s'est dit, quand, et ce qu'il faut faire ensuite. Le champ `Dernier échange` est aujourd'hui saisi à la main, donc condamné à mentir.
- **Objectif** — Un journal des échanges qui se remplit vraiment, et des relances qu'on revoit vraiment.
- **Audience** — *Macao* uniquement, comme 3a.

## 2. Le risque central : un journal pénible reste vide

Les modules précédents se remplissaient d'eux-mêmes : monter un dossier, rattacher un acheteur sont des actes qu'on fait de toute façon. **Journaliser un échange n'est l'acte de personne** — ça se fait après coup, quand l'appel est fini et qu'on est passé à autre chose.

Toute la conception découle de là :

**Le formulaire tient en trois champs.** Canal, date (préremplie à aujourd'hui), compte rendu. Le reste est facultatif. Objectif : trente secondes, depuis la fiche de l'organisation, sans changer d'écran.

**Un seul geste enregistre le passé et programme l'avenir.** Le formulaire porte un champ de plus : *« prévoir une relance le ___ »*. Personne ne crée une tâche séparément ; tout le monde accepte de cocher une date pendant qu'il écrit son compte rendu. C'est la décision structurante de cette livraison.

**Les relances ont un endroit où être vues.** Un bloc sur le tableau de bord, en tête. Une tâche qu'on ne revoit jamais n'existe pas.

## 3. Décisions d'architecture

**Deux tables, parce que ce sont deux natures.** Une interaction est un **fait passé**, qu'on n'amende plus. Une tâche est une **intention future**, avec un responsable et un état. Les fondre dans une table « activités » rendrait les deux bâtards : le fait n'a pas besoin d'être « fait », l'intention n'a pas de compte rendu.

**Le journal alimente `Dernier échange`.** Toute interaction enregistrée met à jour la date sur l'organisation, **côté serveur**. La dette de 3a disparaît : plus personne n'a à y penser.

**Le consentement se raisonne par canal.** Les régimes juridiques diffèrent — l'email B2B repose sur l'intérêt légitime, le SMS et WhatsApp exigent un accord préalable. Un drapeau unique serait faux. Voir §5.

**L'IA prépare, elle n'envoie pas.** Décision du client. Le modèle porte un marqueur `Assistée par IA` sur l'interaction, pour mesurer plus tard ce que ça vaut. Aucun envoi autonome n'est construit ici ni prévu en 3d sur les canaux à consentement.

## 4. Modèle de données

### Table `Interactions` (nouvelle)

| Champ | Type | Valeurs / notes |
|---|---|---|
| Référence | Single line text | champ principal, généré côté serveur : `2026-07-20 · Appel · Mairie de Colomiers` |
| Canal | Single select | Email · Appel · SMS · WhatsApp · Visioconférence · Rendez-vous · LinkedIn · Courrier · Formulaire du site · Autre |
| Sens | Single select | Sortant · Entrant |
| Date | Date | |
| Compte rendu | Long text | ce qui s'est dit |
| Auteur | Single select | Daniel · Dominique · Mathieu |
| Assistée par IA | Checkbox | le message a été préparé avec l'IA |
| Organisation | Link → Organisations | obligatoire |
| Interlocuteur | Link → Interlocuteurs | facultatif |
| Opportunité | Link → Opportunités | facultatif |

### Table `Tâches` (nouvelle)

| Champ | Type | Valeurs / notes |
|---|---|---|
| Intitulé | Single line text | champ principal |
| Échéance | Date | |
| Responsable | Single select | Daniel · Dominique · Mathieu |
| Statut | Single select | À faire · Faite · Annulée |
| Notes | Long text | |
| Organisation | Link → Organisations | |
| Interlocuteur | Link → Interlocuteurs | facultatif |
| Opportunité | Link → Opportunités | facultatif |
| Interaction d'origine | Link → Interactions | d'où vient cette relance |

### Table `Interlocuteurs` (modifiée)

Trois ajouts au modèle de 3a :

| Champ | Type | Valeurs / notes |
|---|---|---|
| Consentement SMS / WhatsApp | Single select | Non renseigné · Accordé · Refusé |
| Date d'opposition | Date | quand la personne s'est opposée |
| Canal de l'opposition | Single select | Email · Téléphone · Courrier · Formulaire · De vive voix · Autre |

Le champ `Opposition à la prospection` créé en 3a reste le **drapeau maître** : coché, il interdit tout démarchage, quel que soit le canal.

## 5. Les règles de démarchage, côté serveur

Une fonction pure `peutEtreDemarche(interlocuteur, canal)` centralise le droit applicable :

- **`Opposition à la prospection` coché** ⇒ faux pour **tous** les canaux, sans exception.
- **SMS et WhatsApp** ⇒ vrai seulement si `Consentement SMS / WhatsApp` vaut `Accordé`. L'absence de réponse n'est pas un accord.
- **LinkedIn** ⇒ toujours faux en automatisé. Le canal existe pour être **journalisé à la main** ; l'automatisation est interdite par la plateforme et fait perdre le compte.
- **Email, appel, courrier** ⇒ vrai en l'absence d'opposition (intérêt légitime B2B).

**⚠️ En 3b, cette fonction informe — elle ne bloque rien.** Elle sert à afficher un avertissement clair sur la fiche. Le blocage effectif viendra avec les campagnes (3d), seul moment où un envoi automatique existera. Enregistrer une opposition ne la fait pas respecter : jusqu'à 3d, c'est la vigilance humaine qui joue. Mieux vaut l'écrire que laisser croire à une protection absente.

## 6. Le classement des relances

Fonction pure `classerRelances(taches, aujourdhui)` renvoyant trois groupes : **en retard**, **cette semaine**, **plus tard**. Seules les tâches `À faire` sont classées.

**⚠️ Comparaison au jour, jamais à l'instant.** Une tâche due *aujourd'hui* n'est pas en retard, et elle doit apparaître dans « cette semaine ». C'est exactement le défaut qui avait été trouvé sur les dossiers de réponse : `new Date('2026-07-20')` vaut minuit UTC, si bien qu'une échéance du jour passait pour dépassée dès 2 h du matin à Paris. Les deux bornes doivent être ramenées au début de leur journée **locale** avant comparaison, et la suite de tests doit s'exécuter correctement sous plusieurs fuseaux.

## 7. Interface intranet

### Sur la fiche d'une organisation
- Un **journal chronologique** : date, canal, sens, auteur, compte rendu. Le plus récent en premier.
- Un bouton **« Journaliser un échange »** ouvrant le formulaire rapide : canal, sens, date (préremplie), compte rendu, et facultativement *« prévoir une relance le ___ »* avec son intitulé.
- Un **avertissement visible** si l'interlocuteur concerné s'est opposé à la prospection, ou si le canal choisi exige un consentement absent.

### Sur le tableau de bord (Macao)
Un bloc **« Vos relances »**, placé avant les autres : les tâches en retard, puis celles de la semaine, puis le nombre de suivantes. Chaque ligne peut être marquée **faite** en un clic.

Deux indicateurs de plus : **relances en retard**, **relances cette semaine**.

## 8. Hors périmètre

Capture automatique des emails (Cci) · synchronisation d'agenda · notifications par email ou push · page dédiée listant toutes les tâches (le bloc du tableau de bord suffit tant que le volume est faible) · envoi de messages depuis l'intranet · campagnes (3d) · rédaction assistée par IA (3d) · registre RGPD formel, qui est un document d'entreprise et non un logiciel.

## 9. Risques et points d'attention

- **Le risque principal reste l'adoption.** Si le formulaire dépasse trente secondes, le journal restera vide et la livraison n'aura servi à rien. Toute demande d'enrichissement du formulaire doit être pesée contre ce risque.
- **Enregistrer une opposition ne la fait pas respecter avant 3d.** Écrit au §5, à répéter à la mise en service.
- **`Référence` est généré à la création** et ne se met pas à jour si la date ou le canal changent ensuite dans Airtable. C'est un libellé d'affichage, pas une donnée : ne pas s'en servir comme source de vérité.
- **Le compte rendu est un champ libre contenant des propos rapportés.** Il relève du RGPD au même titre que les coordonnées : ne pas y consigner de données sensibles ou de jugements sur les personnes.
- **`Dernier échange` sera écrasé par la date de la dernière interaction enregistrée**, même si l'on saisit a posteriori un échange plus ancien. Comportement assumé : la fonction prend le maximum, jamais la dernière écriture.
