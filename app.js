const express = require("express");
const handlebars = require("express-handlebars").engine;
const bodyParser = require("body-parser");
const firebaseAdmin = require("firebase-admin");

const app = express();

const serviceAccount = require("./credential-firebase.json");

firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(serviceAccount),
});

const db = firebaseAdmin.firestore();

app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
const hbs = require("express-handlebars").create({
	defaultLayout: "main",
	helpers: {
		eq: (a, b) => a === b,
	},
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
	res.render("primeira_pagina");
});

app.get("/consulta", async function (req, res) {
	try {
		const agendamentosSnapshot = await db.collection("agendamentos").get();
		const agendamentos = agendamentosSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));
		res.render("consulta", { agendamentos });
	} catch (error) {
		res.status(500).send("Erro ao consultar agendamentos: " + error);
	}
});

app.get("/editar/:id", async function (req, res) {
	try {
		const doc = await db.collection("agendamentos").doc(req.params.id).get();
		if (!doc.exists) {
			return res.status(404).send("Agendamento não encontrado");
		}
		res.render("editar", { agendamento: { id: doc.id, ...doc.data() } });
	} catch (error) {
		res.status(500).send("Erro ao buscar agendamento para edição: " + error);
	}
});

app.get("/excluir/:id", async function (req, res) {
	try {
		await db.collection("agendamentos").doc(req.params.id).delete();
		res.redirect("/consulta");
	} catch (error) {
		res.status(500).send("Erro ao excluir agendamento: " + error);
	}
});

app.post("/cadastrar", async function (req, res) {
	try {
		await db.collection("agendamentos").add({
			nome: req.body.nome,
			telefone: req.body.telefone,
			origem: req.body.origem,
			data_contato: req.body.data_contato,
			observacao: req.body.observacao,
		});
		res.redirect("/consulta");
	} catch (error) {
		res.status(500).send("Erro ao cadastrar agendamento: " + error);
	}
});

app.post("/atualizar", async function (req, res) {
	const id = req.body.id;
	try {
		await db.collection("agendamentos").doc(id).update({
			nome: req.body.nome,
			telefone: req.body.telefone,
			origem: req.body.origem,
			data_contato: req.body.data_contato,
			observacao: req.body.observacao,
		});
		res.redirect("/consulta");
	} catch (error) {
		res.status(500).send("Erro ao atualizar agendamento: " + error);
	}
});

app.listen(8081, function () {
	console.log("Servidor ativo!");
});
