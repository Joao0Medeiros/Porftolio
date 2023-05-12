import Maincontent from "./components/Maincontent";
import Sidebar from "./components/sidebar";

import "./styles/components/app.sass";

function App() {

  return (
    <div id="portfolio">
      <h1>João Medeiros</h1>
      <Sidebar />
      <Maincontent />
    </div>
  );
}

export default App
