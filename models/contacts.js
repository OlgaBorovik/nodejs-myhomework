const mongoose = require("mongoose")

const schema = mongoose.Schema(
      {
    name: {
      type: String,
      required: [true, 'Set name for contact'],
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
    }
      }, {
        versionKey: false,
        timestamps: true,
  }
    )

    const Contact = mongoose.model("contact", schema)
    
module.exports = {
     Contact,
   }

