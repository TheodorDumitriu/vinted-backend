const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");

const router = express.Router();

const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // Bringing variable from isAuthenticated
      const user = req.user;
      const { title, description, price, brand, size, condition, color, city } =
        req.body;
      // console.log(title.length);
      if (title.length >= 50) {
        return res
          .status(401)
          .json({ message: "Title needs to be 50 characters max" });
      }

      if (description.length >= 500) {
        return res
          .status(401)
          .json({ message: "Description needs to be 500 characters max" });
      }

      if (Number(price) >= 100000) {
        return res
          .status(401)
          .json({ message: "Price needs to be 100000€ max" });
      }

      if (req.files === null || req.files.picture.length === 0) {
        return res.json("No file uploaded!");
      }

      // Upload array of images
      const imgsToUpload = req.files.picture;

      const imgsPromises = imgsToUpload.map((img) => {
        return cloudinary.uploader.upload(convertToBase64(img), {
          folder: "vinted/offers",
        });
      });

      const resImgsToUpload = await Promise.all(imgsPromises);
      // const resImgsToUpload = [
      //   {
      //     asset_id: "e32d7f1b4d705c9738b36a414fd9f8eb",
      //     public_id: "vinted/offers/tu9ow74urbwsjc1oiswf",
      //     version: 1710174472,
      //     version_id: "7b177ddbc74498754110172844999c32",
      //     signature: "f55c22df3436c8cc08b69be8acbf8d3df61f0925",
      //     width: 500,
      //     height: 1120,
      //     format: "jpg",
      //     resource_type: "image",
      //     created_at: "2024-03-11T16:27:52Z",
      //     tags: [],
      //     bytes: 121006,
      //     type: "upload",
      //     etag: "c9db28871640574d8b041171e9056f61",
      //     placeholder: false,
      //     url: "http://res.cloudinary.com/dtmktc6lq/image/upload/v1710174472/vinted/offers/tu9ow74urbwsjc1oiswf.jpg",
      //     secure_url:
      //       "https://res.cloudinary.com/dtmktc6lq/image/upload/v1710174472/vinted/offers/tu9ow74urbwsjc1oiswf.jpg",
      //     folder: "vinted/offers",
      //     api_key: "445343842699418",
      //   },
      //   {
      //     asset_id: "e69c351b431ed062be9ba0238e6bcd2e",
      //     public_id: "vinted/offers/mt9rbketa02gh07kma2l",
      //     version: 1710174472,
      //     version_id: "7b177ddbc74498754110172844999c32",
      //     signature: "b2ea85b18a6be19f7f00861888825425fa9fc11c",
      //     width: 736,
      //     height: 1104,
      //     format: "jpg",
      //     resource_type: "image",
      //     created_at: "2024-03-11T16:27:52Z",
      //     tags: [],
      //     bytes: 141032,
      //     type: "upload",
      //     etag: "8e06d81e894706de5a06f4a20f36ad8a",
      //     placeholder: false,
      //     url: "http://res.cloudinary.com/dtmktc6lq/image/upload/v1710174472/vinted/offers/mt9rbketa02gh07kma2l.jpg",
      //     secure_url:
      //       "https://res.cloudinary.com/dtmktc6lq/image/upload/v1710174472/vinted/offers/mt9rbketa02gh07kma2l.jpg",
      //     folder: "vinted/offers",
      //     api_key: "445343842699418",
      //   },
      // ];

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: resImgsToUpload,
        owner: user._id,
      });

      await newOffer.save();
      // console.log(newOffer);

      const resImgsUrls = [];
      for (let i = 0; i < resImgsToUpload.length; i++) {
        resImgsUrls.push(resImgsToUpload[i].secure_url);
      }

      const resObject = {
        _id: newOffer._id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: newOffer.product_details,
        owner: {
          account: {
            username: user.account.username,
          },
          _id: user._id,
        },
        product_image: resImgsUrls,
      };

      res.status(201).json(resObject);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

//Update Offer
router.put(
  "/offer/update/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // Bringing variable from isAuthenticated
      const user = req.user;
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const img = req.files.picture;
      const offerToUpdate = await Offer.findById(req.params.id);
      // console.log(offerToUpdate);

      if (title) {
        offerToUpdate.product_name = title;
      }
      if (description) {
        offerToUpdate.product_description = description;
      }

      if (price) {
        offerToUpdate.product_price = price;
      }

      if (brand || size || condition || color || city) {
        offerToUpdate.product_details = [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ];
      }

      // Check if the image is the same
      // If different image => delete image from cloudinary => upload new image => save response du DB
      if (offerToUpdate.product_image.etag !== img.md5) {
        const imgToUpload = convertToBase64(req.files.picture);
        const imgId = offerToUpdate.product_image.public_id;
        await cloudinary.uploader.destroy(imgId, {
          folder: "vinted/offers",
        });

        const imgUploadedResponse = await cloudinary.uploader.upload(
          imgToUpload,
          {
            folder: "vinted/offers",
          }
        );
        offerToUpdate.product_image = imgUploadedResponse;
      }

      await offerToUpdate.save();
      // TODO update response object
      res.status(201).json(offerToUpdate);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete route
router.delete(
  "/offer/delete/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const offerToDelete = await Offer.findById(req.params.id);
      const imgIdToDelete = offerToDelete.product_image.public_id;
      await cloudinary.uploader.destroy(imgIdToDelete, {
        folder: "vinted/offers",
      });

      await Offer.findByIdAndDelete({ _id: req.params.id });

      res.status(200).json({ message: "Offer was deleted!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// GET - Listing Offers
// TODO Refacto the get offers route with destructuring. => if query is empty => undeifned, use that!
router.get("/offers", async (req, res) => {
  try {
    //title=panta&priceMin=30&priceMax=200&sort=price-desc&page=1
    // Pagination
    const limit = 3;
    let page = req.query.page;

    const filters = req.query;
    console.log("req.query", filters, "\n\n\n");

    //Filtering
    const filtersObj = {};

    filters.title
      ? (filtersObj.product_name = new RegExp(filters.title, "i"))
      : undefined;

    if (filters.priceMin) {
      filtersObj.product_price = {
        $gte: filters.priceMin,
      };
    }

    if (filters.priceMax) {
      filtersObj.product_price = {
        $lte: filters.priceMax,
      };
    }

    if (filters.priceMin && filters.priceMax) {
      filtersObj.product_price = {
        $gte: filters.priceMin,
        $lte: filters.priceMax,
      };
    }

    // Sorting ascending and descending
    let sort = 1;
    if (filters.sort === "price-asc") {
      sort = 1;
    } else if (filters.sort === "price-desc") {
      sort = -1;
    }

    console.log(filtersObj);
    console.log("filterObj", filtersObj);

    const offersList = await Offer.find(filtersObj)
      // .select("product_name product_price")
      .skip(limit * (Number(page) - 1))
      .limit(limit)
      .sort({
        product_price: sort,
      });

    // TODO - Update count to take into account the results wihtout the pagination (countDocuments - mongoose method)
    const responseObj = {
      count: offersList.length,
      offersList,
    };

    res.status(200).json(responseObj);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// GET offer by ID
router.get("/offers/:id", fileUpload(), async (req, res) => {
  try {
    // TODO Move findById() in utils
    const offerToGet = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );

    res.status(200).json(offerToGet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
