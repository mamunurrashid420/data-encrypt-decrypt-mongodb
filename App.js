import React, { useState, useEffect } from "react";
import axios from "axios";
import crypto from "crypto-browserify"; // Browser version of crypto

const algorithm = "aes-256-cbc";
const key = crypto.scryptSync("mongodb-encrypt-decrypt", "salt", 32);

const decryptData = (ivBase64, encryptedText) => {
  try {
    const iv = Buffer.from(ivBase64, "base64");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    return "Decryption Failed";
  }
};

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3001/data").then((response) => {
      setData(response.data);
    });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔐 Encrypted Data from MongoDB</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>#</th>
            <th>Encrypted Text</th>
            <th>Decrypted Text</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item._id}>
              <td>{index + 1}</td>
              <td>{item.encrypted}</td>
              <td>{decryptData(item.iv, item.encrypted)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
