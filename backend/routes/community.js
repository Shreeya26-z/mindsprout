const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/community — get all posts
router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    const postsWithLikes = posts.map(p => ({
      ...p.toObject(),
      likeCount: p.likes.length,
      likedByMe: p.likes.includes(req.userId),
      authorName: p.isAnonymous ? "Anonymous User" : p.userId?.name || "User",
    }));

    res.json({ posts: postsWithLikes });
  } catch (error) {
    console.error("Community GET error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/community — create a post
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;

    if (!content || content.trim().length < 2) {
      return res.status(400).json({ message: "Post content is required." });
    }

    const post = new Post({
      userId: req.userId,
      content: content.trim(),
      isAnonymous: isAnonymous || false,
    });

    await post.save();

    // Award XP
    const user = await User.findById(req.userId);
    user.xp += 5;
    user.computeLevel ? user.computeLevel() : (user.level = Math.floor(user.xp / 50) + 1);
    await user.save();

    res.status(201).json({
      message: "Post shared! +5 XP 🎉",
      post,
    });
  } catch (error) {
    console.error("Community POST error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// PATCH /api/community/:id/like — like or unlike a post
router.patch("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const alreadyLiked = post.likes.includes(req.userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.userId.toString());
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    res.json({
      message: alreadyLiked ? "Unliked" : "Liked!",
      likeCount: post.likes.length,
      likedByMe: !alreadyLiked,
    });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/community/:id — delete own post
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.json({ message: "Post deleted." });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;