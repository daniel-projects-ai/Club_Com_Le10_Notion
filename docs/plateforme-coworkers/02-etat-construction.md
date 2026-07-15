# État de construction — Plateforme Coworkers LE 10

**Dernière mise à jour :** 2026-07-15 — construction automatisée via API Airtable + Jotform.

## Liens utiles

- **Base Airtable :** https://airtable.com/appdJ309q39i4Gr8t
- **Interface « Espace Coworkers » :** https://airtable.com/appdJ309q39i4Gr8t/pbdjsXShDouOcc2Vn
- **Interface « Pilotage Macao » :** https://airtable.com/appdJ309q39i4Gr8t/pbdLYM4ZIsj7GFW0j
- **Formulaire inscription (Jotform) :** https://form.jotform.com/261955996118069
- **Formulaire contact (Jotform) :** https://form.jotform.com/261956539490066

## Identifiants techniques

**Base :** `appdJ309q39i4Gr8t`

| Table | tableId |
|---|---|
| Métiers | `tblkKza5jMfBqEC4b` |
| Coworkers | `tbl89xazn0oY4A18o` |
| Opportunités | `tbl3jvmo4VjUDTkmD` |
| Positionnements | `tbllJ1W7jxuTcODwe` |
| Commentaires | `tblvkQvlOW9CdKEPm` |
| Contacts | `tblddrQJJgmh0FW21` |

**Interfaces :** Espace Coworkers `pbdjsXShDouOcc2Vn` · Pilotage Macao `pbdLYM4ZIsj7GFW0j`

**Formulaires Jotform :** inscription `261955996118069` · contact `261956539490066`

## Avancement

- [x] **Phase 1 — Base Airtable** (Livrable 2) : 6 tables reliées, 15 métiers, 3 membres Macao, 7 opportunités migrées avec métiers associés.
- [x] **Phase 2 — Formulaires Jotform** (Livrable 3) : formulaires inscription + contact créés.
- [ ] **Phase 2.3 — Connexion Jotform → Airtable** : à autoriser dans chaque formulaire (Settings → Integrations → Airtable) — étape OAuth entre les deux comptes.
- [x] **Phase 3 — Interfaces** (Livrable 4) : Espace Coworkers (Opportunités + Annuaire) et Pilotage Macao (Pipeline, Positionnements, Inscriptions à valider, Contacts) publiées.
- [ ] **Phase 3.3 — Accès par rôle** : partager les interfaces avec les bonnes personnes/permissions (UI Airtable).
- [ ] **Phase 4 — Agent IA** (Livrable 5) : automatisations Airtable AI (enrichir + matcher) — à créer dans l'UI Airtable (non disponible via API). Prompts prêts dans le plan.

## Étapes restantes (UI, non automatisables par API)

1. **Connexion Jotform → Airtable** (chaque formulaire) : Settings → Integrations → Airtable → base « LE 10 — Plateforme Coworkers », mapping champ à champ.
2. **Automatisations Airtable AI** : voir prompts dans `docs/superpowers/plans/2026-07-15-plateforme-coworkers.md` (Tâche 4.1–4.3).
3. **Partage & accès** : Interface « Espace Coworkers » → coworkers (commenter) ; « Pilotage Macao » → équipe Macao (éditeur).
4. **Bouton « Ça m'intéresse »** : à ajouter dans l'éditeur d'interface (élément Bouton → crée un Positionnement) pour un positionnement en 1 clic (sinon les coworkers utilisent le champ Positionnements dans le détail).
