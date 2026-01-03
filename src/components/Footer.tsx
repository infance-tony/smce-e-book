
const Footer = () => {
  const handleInfanceTonyClick = () => {
    window.open('https://github.com/infance-tony', '_blank');
  };

  const handleByteBashBlitzClick = () => {
    window.open('https://github.com/infance-tony', '_blank');
  };

  return (
    <footer className="text-center py-4 text-sm text-gray-600">
      <div>
        Copyright{' '}
        <span 
          onClick={handleInfanceTonyClick}
          className="cursor-pointer hover:text-primary transition-colors"
          style={{ textDecoration: 'none' }}
        >
          Infance Tony
        </span>
        {' All Rights Reserved'}
      </div>
      <div>
        Developed by{' '}
        <span 
          onClick={handleInfanceTonyClick}
          className="cursor-pointer hover:text-primary transition-colors"
          style={{ textDecoration: 'none' }}
        >
          Infance Tony
        </span>
        {' Distribuited by '}
        <span 
          onClick={handleByteBashBlitzClick}
          className="cursor-pointer hover:text-primary transition-colors"
          style={{ textDecoration: 'none' }}
        >
          Byte Bash Blitz
        </span>
      </div>
    </footer>
  );
};

export default Footer;
