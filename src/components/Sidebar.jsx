import SocialNetworkContainer from "./SocialNetworkContainer";
import InformationContainer from "./InformationContainer";
import doc from "/docs/Currículo João.pdf"

import Avatar from "../img/FotoPF.png";

import "../styles/components/sidebar.sass";

const Sidebar = () => {
  return (
    <aside id="sidebar">
      <img src={Avatar} alt="Joao medeiros" />
      <p className="title">Desenvolvedor</p>
      <SocialNetworkContainer />
      <InformationContainer />
      <a href={doc} download className="btn">

        Download currículo
      </a>
    </aside>
  );
};

export default Sidebar;