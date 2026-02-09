# Formulaire contact – faire partir les mails

Deux possibilités (une seule suffit).

---

## Méthode 1 : Formspree (sans serveur Node)

Le formulaire envoie les messages à Formspree, qui vous les transmet par email. Aucun serveur à lancer.

1. Allez sur **https://formspree.io** et créez un compte (gratuit).
2. Cliquez sur **New form**.
3. Donnez un nom au formulaire et indiquez l’email de réception : **philippe.clemente@orange.fr**.
4. Formspree vous donne une URL du type : `https://formspree.io/f/mqknjxyz`.  
   L’**ID** est la partie après `/f/` (ex. : `mqknjxyz`).
5. Ouvrez **index.html** dans un éditeur, cherchez **FORMSPREE_FORM_ID**, et remplacez la valeur vide par cet ID :
   ```html
   window.FORMSPREE_FORM_ID = 'mqknjxyz';  // votre ID
   ```
6. Enregistrez. Les mails partiront dès que quelqu’un envoie le formulaire (même en ouvrant le site en local ou sur un hébergeur statique).

---

## Méthode 2 : Serveur Node (Resend ou Gmail)

Lancez le serveur dans le dossier `server/` et configurez soit Resend, soit Gmail.

### Démarrer le serveur

```bash
cd server
npm install
npm start
```

Ouvrez le site sur **http://localhost:3000** (pas en double-cliquant sur index.html). Le formulaire enverra les messages via l’API du serveur.

### Option A – Resend

1. Créez un compte sur **https://resend.com**.
2. Générez une clé API.
3. Dans le fichier **server/.env**, remplissez :
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   CONTACT_EMAIL=philippe.clemente@orange.fr
   FROM_EMAIL=onboarding@resend.dev
   ```

### Option B – Gmail

1. Dans **server/.env**, laissez **RESEND_API_KEY** vide et remplissez :
   ```env
   GMAIL_USER=votre@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   CONTACT_EMAIL=philippe.clemente@orange.fr
   ```
2. Le mot de passe d’application se crée dans le compte Google : Sécurité → Validation en 2 étapes → Mots de passe des applications.

---

En résumé : pour que les mails partent sans rien installer, utilisez **Formspree** (méthode 1). Pour tout gérer sur votre serveur, utilisez la **méthode 2** avec Resend ou Gmail.
