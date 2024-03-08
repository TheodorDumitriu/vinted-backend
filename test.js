const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const body = {
  username: "professor xavier",
  email: "professor-xavier@lereacteur.io",
  password: "azerty",
  newsletter: true,
};

const userCredentials = {
  salt: uid2(16),
  hashGenerator() {
    console.log("this.salt", this.salt);
    return SHA256(body.password + this.salt).toString(encBase64);
  },
  token: uid2(64),
  hash() {
    return this.hashGenerator();
  },
};

console.log(userCredentials);
console.log(userCredentials.hash());

const someObj = {
  _id: "5f89a72435e128e99550837e",
  product_name: "Air Max 90",
  product_description: "Air Max 90, très peu portées",
  product_price: 80,
  product_details: [
    {
      MARQUE: "Nike",
    },
    {
      TAILLE: "44",
    },
    {
      ÉTAT: "Neuf",
    },
    {
      COULEUR: "Blue",
    },
    {
      EMPLACEMENT: "Paris",
    },
  ],
  owner: {
    account: {
      username: "JohnDoe",
      avatar: {
        // ...
        // Informations sur l'avatar (si l'utilisateur en a un)
        // ...
        secure_url:
          "https://res.cloudinary.com/lereacteur-apollo/image/upload/v1602491671/api/vinted/users/5f84151633ef6e7461b4debe/avatar.jpg",
      },
    },
    _id: "5f84151633ef6e7461b4debe",
  },
  product_image: {
    // ...
    // informations sur l'image du produit
    secure_url:
      "https://res.cloudinary.com/lereacteur-apollo/image/upload/v1602856743/api/vinted/offers/5f89a72435e128e99550837e/preview.jpg",
    // ...
  },
};

if (offerToUpdateImgComparer.product_image.etag !== img.picture.md5) {
  const imgToUpdate = convertToBase64(req.files.picture);
  const imgId = offerToUpdateImgComparer.product_image.public_id;
  await cloudinary.uploader.destroy(imgId, {
    folder: "vinted/offers",
  });

  const imgUploadResult = await cloudinary.uploader.upload(imgToUpdate, {
    folder: "vinted/offers",
  });
  console.log(imgUploadResult);
}

// console.log(offerToUpdate);

let sort = 1;
if (req.query.sort === "price-asc") {
  sort = 1;
} else if (req.query.sort === "price-desc") {
  sort = -1;
}
console.log(sort);
const offersList = await Offer.find()
  .select("product_name product_price")
  .skip(limit * (Number(page) - 1))
  .limit(limit)
  .sort({
    product_price: sort,
  });
