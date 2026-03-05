export const htmlContent =(link)=>{return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Welcome Email</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      h1 { color: #333333; }
      p { color: #555555; line-height: 1.5; }
      a.button {
        display: inline-block;
        padding: 10px 20px;
        margin-top: 20px;
        background-color: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 5px;
      }
      a.button:hover { background-color: #45a049; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Assalamualaikum Wa-Rahmatullah</h1>
      <h2>Welcome to Jotno!</h2>
      <p>Thank you for signing up. We are excited to have you on board.</p>
      <p>Click the button below to verify your email:</p>
      <a href=${link} class="button">Verify Email</a>
      <p>If you did not sign up, ignore this email.</p>
      <p>Regards,<br>Team Jotno</p>
    </div>
  </body>
</html>
`;}
