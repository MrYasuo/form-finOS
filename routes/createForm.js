const express = require("express");
const router = express.Router();
const { nanoid } = require("nanoid");
const { User, Form, GuessData } = require("../models");
const secured = require("../lib/middleware/secured");

router.get("/createForm/:slug", secured(), (req, res) => {
	const formId = req.params.slug;
	User.findOne({ email: req.user.email }).then((user) => {
		const currentForm = user.forms.find((form) => form.id === formId);
		if (!currentForm) {
			const newForm = new Form({
				name: "Blank Form",
				id: formId,
				form: `<div class="form-question--title w-100 outer-shadow"><input type="text" name="title-form" id="form--title" class="form--title" value="Blank form" required><div class="section--endline--inner"></div><input type="text" name="form-des" id="form--sub-title" class="form--sub-title" placeholder="Form description"><div class="section--endline--inner"></div></div><div class="form-question--body outer-shadow" id="form-question--body"></div>`,
			});
			user.forms.push(newForm.toObject());
			req.user.forms = user.forms;
			user.save();
			res.render("createForm", {
				currentForm: newForm.toObject(),
				guessData: [],
			});
		} else {
			let currentGuessData = [];
			GuessData.find({ formId: formId }).then((guessDatas) => {
				guessDatas.forEach((guessData) => {
					currentGuessData.push(guessData.toObject());
				});
			});
			res.render("createForm", { currentForm, guessData: currentGuessData });
		}
	});
});

router.post("/createForm/:slug", (req, res) => {
	switch (req.body.action) {
		case "save": {
			User.findOne({ email: req.user.email }).then((user) => {
				const index = user.forms.indexOf(
					user.forms.find((form) => form.id === req.params.slug)
				);
				const newForm = new Form({
					name: req.body.title,
					id: req.params.slug,
					form: req.body.form,
				});
				Form.findOne({ id: req.params.slug }).then((currentForm) => {
					if (!currentForm) {
						newForm.save();
					} else {
						currentForm.name = newForm.name;
						currentForm.form = newForm.form;
						currentForm.save();
					}
				});
				user.forms[index] = newForm.toObject();
				req.user.forms = user.forms;
				res.redirect("/dashboard");
				user.save();
			});
			break;
		}
		case "preview": {
			Form.findOne({ id: req.params.slug })
				.then((currentForm) => {
					if (!currentForm) {
						const newForm = new Form({
							name: req.body.title,
							id: req.params.slug,
							form: req.body.form,
						});
						newForm.save();
					} else {
						currentForm.name = req.body.title;
						currentForm.form = req.body.form;
						currentForm.save();
					}
					res.send({ redirect: `/form/${req.params.slug}?preview=true` });
				})
				.catch((err) => console.log(err));
			break;
		}
		case "send": {
			Form.findOne({ id: req.params.slug }).then((currentForm) => {
				if (!currentForm) {
					const newForm = new Form({
						name: req.body.title,
						id: req.params.slug,
						form: req.body.form,
					});
					newForm.save();
				} else {
					currentForm.name = req.body.title;
					currentForm.form = req.body.form;
					currentForm.save();
				}
			});
		}
		case "show": {
			GuessData.findOne({ userId: req.body.uuid }).then((guessData) => {
				res.send({ redirect: `/dashboard/guess/${guessData.userId}` });
			});
		}
	}
});

module.exports = router;
