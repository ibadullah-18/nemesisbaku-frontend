import { LanguageProvider } from "./i18n/LanguageContext";
import AppRoutes from "./routes/AppRoutes";
import UserToastHost from "./components/common/UserToastHost";

export default function App() {
  return (
    <LanguageProvider>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #fafafa;
            color: #111111;
            font-family: "Nunito Sans", Inter, Arial, sans-serif;
          }

          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear {
            display: none;
          }

          input::-webkit-credentials-auto-fill-button,
          input::-webkit-contacts-auto-fill-button {
            visibility: hidden;
            display: none !important;
            pointer-events: none;
          }

        `}
      </style>

      <UserToastHost />
      <AppRoutes />
    </LanguageProvider>
  );
}
