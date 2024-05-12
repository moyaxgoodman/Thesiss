import express from "express";
import { getUser , updateUser,hasDonated,getAllUsers,deleteUser} from "../controllers/user.js";

const router = express.Router()

router.get("/find/:userId", getUser)
// router.get("/get-user-posts/:userId", getUserPosts)
router.get('/all-users',getAllUsers)
router.get('/donator',hasDonated)
router.put("/update/:id", updateUser)
router.delete('/delete/:id',deleteUser)



export default router