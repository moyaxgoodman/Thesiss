import express from "express";
import { getPosts, addPost, deletePost, getRecentPosts, hasDonated, getUserOwnPosts, updatePost } from "../controllers/post.js";

const router = express.Router();

router.get("/", getPosts);
router.post("/", addPost);
router.put('/update-post/:id',updatePost)
router.delete("/:id", deletePost);
router.get("/get-own-posts/:id",getUserOwnPosts)
router.post("/recent",getRecentPosts)
router.post("/donator",hasDonated)

export default router;
