Jotno App — Notes

- Registration now requires a phone number in addition to email.
- Family Integration supports adding members via either email or phone.
- Backend: `User` model includes `phone` (unique, required). Register API validates `phone` and returns it.
- Frontend: Register form includes a phone field; Family page lets you choose Email or Phone when adding members.

