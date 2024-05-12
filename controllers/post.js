import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import moment from "moment";

export const getPosts = (req, res) => {
  const token = req.cookies.accessToken;
  // if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    // if (err) return res.status(403).json("Token is not valid!");

    const q = `SELECT p.*, u.id AS userId, name, profilePic 
               FROM posts AS p 
               JOIN users AS u ON (u.id = p.userId) 
               ORDER BY p.createdAt DESC`;

    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json(data);
    });
  });
};


export const addPost = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const { desc, img, donatorType } = req.body;

    const q =
      "INSERT INTO posts (`desc`, `img`, `createdAt`, `userId`, `donatorType`) VALUES (?, ?, ?, ?, ?)";
    const values = [
      desc,
      img,
      moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
      userInfo.id,
      donatorType,
    ];

    db.query(q, values, (err, result) => {
      if (err) {
        console.error("Error adding post:", err);
        return res.status(500).json("Error adding post");
      }

      if (result.affectedRows === 0) {
        console.error("No rows affected, post not added.");
        return res.status(500).json("No rows affected, post not added");
      }

      // Update the hasDonated column in the users table
      const updateQuery = "UPDATE users SET hasDonated = 1 WHERE id = ?";
      db.query(updateQuery, [userInfo.id], (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating hasDonated column:", updateErr);
          return res.status(500).json("Error updating hasDonated column");
        }

        if (updateResult.affectedRows === 0) {
          console.error("User not found or no changes were made.");
          return res.status(404).json("User not found or no changes were made.");
        }

        return res.status(200).json("Post has been created.");
      });
    });
  });
};

export const deletePost = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Query the database to get user's role
    const roleQuery = "SELECT role FROM users WHERE id = ?";
    db.query(roleQuery, [userInfo.id], (roleErr, roleResult) => {
      if (roleErr) return res.status(500).json(roleErr);

      const userRole = roleResult[0].role;

      // Check if user is an admin or has role 1
      if (userRole === 1) {
        // User is admin, allow deletion
        const deleteQuery = "DELETE FROM posts WHERE `id` = ?";
        db.query(deleteQuery, [req.params.id], (deleteErr, deleteResult) => {
          if (deleteErr) return res.status(500).json(deleteErr);
          if (deleteResult.affectedRows > 0) {
            return res.status(200).json("Post has been deleted.");
          } else {
            return res.status(404).json("Post not found.");
          }
        });
      } else {
        // User is not admin, check if they own the post
        const ownershipQuery = "SELECT userId FROM posts WHERE `id` = ?";
        db.query(ownershipQuery, [req.params.id], (ownErr, ownResult) => {
          if (ownErr) return res.status(500).json(ownErr);

          const postOwnerId = ownResult[0].userId;

          if (postOwnerId === userInfo.id) {
            // User owns the post, allow deletion
            const deleteQuery = "DELETE FROM posts WHERE `id` = ?";
            db.query(deleteQuery, [req.params.id], (deleteErr, deleteResult) => {
              if (deleteErr) return res.status(500).json(deleteErr);
              if (deleteResult.affectedRows > 0) {
                return res.status(200).json("Post has been deleted.");
              } else {
                return res.status(404).json("Post not found.");
              }
            });
          } else {
            return res.status(403).json("You can only delete your own posts.");
          }
        });
      }
    });
  });
};

export const getRecentPosts = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = `SELECT p.*, u.id AS userId, name, profilePic 
               FROM posts AS p 
               JOIN users AS u ON (u.id = p.userId) 
               ORDER BY p.createdAt DESC
               LIMIT 2`; // Limit the result to 2 posts

    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json(data);
    });
  });
};

export const hasDonated = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = `SELECT * FROM users WHERE hasDonated = 1 LIMIT 10`;
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);

      // Shuffle the data array
      const shuffledData = shuffleArray(data);

      return res.status(200).json(shuffledData);
    });
  });
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
export const getUserOwnPosts = (req, res) => {
  const userId = req.params.id;

  const q = `
    SELECT p.*, u.id AS userId, name, profilePic 
    FROM posts AS p 
    JOIN users AS u ON (u.id = p.userId) 
    WHERE p.userId = ?  -- Filter by user ID
    ORDER BY p.createdAt DESC`;

  db.query(q, [userId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const updatePost = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");
  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const postId = req.params.id;
    const { donationStatus, location, userId } = req.body; // Update fields based on your modal
    const q = ` 
      UPDATE posts 
      SET 
        donationStatus = ?, 
        location = ?
      WHERE 
        id = ? AND 
        userId = ?
    `;
    const values = [donationStatus, location, postId, userId];

    db.query(q, values, (err, result) => {
      if (err) {
        console.error("Error updating post:", err);
        return res.status(500).json("Error updating post.");
      }

      if (result.affectedRows === 0) {
        console.error("No rows affected, post not updated.");
        return res.status(404).json("No rows affected, post not updated");
      }

      return res.status(200).json("Post has been updated.");
    });
  });
};
