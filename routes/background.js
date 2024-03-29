import express from 'express';
import { deleteBackground, getBackground, setBackground, setCurrentBackground } from '../controllers/background.js';
import singleStorage from '../middlewares/multer.js';
import { isAuthenciated } from '../utils/isAuthenciated.js';

const backgroundRouter = express.Router();

backgroundRouter.get('/getBackground', isAuthenciated, getBackground);
backgroundRouter.post('/setBackground', isAuthenciated, singleStorage, setBackground);
backgroundRouter.delete('/deleteBackground/:id', isAuthenciated, deleteBackground);
backgroundRouter.post('/currentBackground/:id', isAuthenciated, setCurrentBackground);

export default backgroundRouter;
