import { LanguageProvider } from "./i18n/LanguageContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <LanguageProvider>
      <style>
        {`
          @import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300..900&display=swap");

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

          @keyframes pageSlideIn {
            from {
              opacity: 0;
              transform: translateY(14px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <AppRoutes />
    </LanguageProvider>
  );
}