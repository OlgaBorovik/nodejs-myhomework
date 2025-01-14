const { Contact } = require("../models/contacts");

async function getContacts(req, res, next) {
    try {
      const { _id } = req.user
      const { page = 1, limit = 20 } = req.query
      const skip = (page - 1) * limit
    const contacts = await Contact.find({owner: _id}, "", {skip, limit:Number(limit)});
    console.log("contacts:", contacts);
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
}

async function getContact(req, res, next) {
  try {
    const { contactId } = req.params;
    const contact = await Contact.findById(contactId);
    if (contact) {
      console.log("contact:", contact);
      return res.status(200).json(contact);
    }
    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    next(error);
  }
}

async function createContact(req, res, next) {
  try {
    const {_id} = req.user
    const { name, email, phone, favorite} = req.body;
    const newContact = await Contact.create({ name, email, phone, favorite, owner: _id });
    return res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
}

async function deleteContact(req, res, next) {
  try {
    const { contactId } = req.params;
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ message: "Not found" });
    }
    await Contact.findByIdAndRemove(contactId);
    return res.status(200).json({ message: `contact ${contactId} deleted` });
  } catch (error) {
    next(error);
  }
}

async function changeContact(req, res, next) {
  try {
    const { contactId } = req.params;
    const { name, email, phone } = req.body;
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { name, email, phone },
      { new: true }
    );
    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
}

async function updateStatusContact(req, res, next) {
  try {
    const { contactId } = req.params;
    const { favorite } = req.body;
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      { new: true }
    );
    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getContacts,
  getContact,
  deleteContact,
  createContact,
  changeContact,
  updateStatusContact,
};
