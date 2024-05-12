import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getUser = (req, res) => {
  const userId = req.params.userId;
  const q = "SELECT * FROM users WHERE id=?";

  db.query(q, [userId], (err, data) => {
    if (err) return res.status(500).json(err);
    const { password, ...info } = data[0];
    return res.json(info);
  });
};
export const updateUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const userId = userInfo.id;

    // Extract userId from req.params.id
    const id = req.params.id;

    // Construct the SQL query to select the role of the user with the specified ID
    const query = `SELECT role FROM users WHERE id = ${userId}`;


    db.query(query, (err, results) => {
      if (err) {
        console.error("Error selecting role:", err);
        return res.status(500).json({ error: "Error selecting role" });
      }

      if (results.length === 0) {
        console.error("User not found");
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = results[0].role;

      // Ensure that the user can only update their own profile or if their role is equal to 1
      if (userRole !== 1) {
        return res.status(403).json("You can update only your profile!");
      }

      const updateFields = req.body;

      // Construct SET clause dynamically based on the keys in req.body
      const setClause = Object.keys(updateFields).map(key => `${key}=?`).join(", ");

      const q = `UPDATE users SET ${setClause} WHERE id=?`;

      // Extract values from req.body and append userId to the end
      const values = [...Object.values(updateFields), id];

      db.query(q, values, (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.affectedRows > 0) return res.json("Updated!");
        return res.status(404).json("User not found or no changes were made.");
      });
    });
  });
};

export const hasDonated = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = `SELECT * FROM users WHERE hasDonated = 1`;
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json(data);
    });
  });
};

export const getAllUsers = (req,res) =>{
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = `SELECT * FROM users`;
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json(data);
    });
  });
}
export const deleteUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const userId = userInfo.id;

    // Construct the SQL query to select the role of the user with the specified ID
    const query = `SELECT role FROM users WHERE id = ${userId}`;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Error selecting role:", err);
        return res.status(500).json({ error: "Error selecting role" });
      }

      if (results.length === 0) {
        console.error("User not found");
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = results[0].role;

      // Ensure that the user has admin role (role = 1)
      if (userRole !== 1) {
        return res.status(403).json("You are not authorized to delete users!");
      }

      const id = req.params.id;
      const q = "DELETE FROM users WHERE id = ?";

      db.query(q, [id], (err, result) => {
        if (err) {
          console.error("Error deleting user:", err);
          return res.status(500).json({ error: "Error deleting user" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
      });
    });
  });
};