const {ProjectComment,Project,User} = require('../models');
const Sequelize = require('sequelize');
const {verifyToken} = require('./middlewares');
const express = require('express');
const router = express.Router();
const {v4:uuidv4} = require("uuid")
const {Op} = require("sequelize");