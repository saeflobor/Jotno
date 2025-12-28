import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

export default function VerifyEmail({ setUser }) {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.post('/api/users/verifyemail', { token });

        
        localStorage.setItem("token", res.data.token);

        setUser(res.data.user);

        navigate("/dashboard");
      } catch (err) {
        setMessage("Verification link expired or invalid");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate, setUser]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Email Verification</h2>

      {loading && <p>Verifying your email...</p>}

      {!loading && message && (
        <p style={{ color: "red" }}>{message}</p>
      )}
    </div>
  );
}
