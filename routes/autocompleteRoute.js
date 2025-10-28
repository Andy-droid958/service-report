const express = require('express');
const router = express.Router();
const autocompleteController = require('../controllers/autocompleteController');

router.get('/attn', autocompleteController.getAttnSuggestions);
router.get('/projectName', autocompleteController.getProjectNameSuggestions);
router.get('/yourRef', autocompleteController.getYourRefSuggestions);
router.get('/serviceBy', autocompleteController.getServiceBySuggestions);
router.get('/systemName', autocompleteController.getSystemNameSuggestions);
router.get('/plcHmi', autocompleteController.getPlcHmiSuggestions);
router.get('/brand', autocompleteController.getBrandSuggestions);
router.get('/modelNumber', autocompleteController.getModelNumberSuggestions);
//router.get('/remarks', autocompleteController.getRemarksSuggestions);

module.exports = router;

