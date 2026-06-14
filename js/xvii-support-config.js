// XVII support link configuration.
// Extracted from Stage 9H during Stage 10 Stability cleanup.
// Buy Me a Coffee support link.
  const XVII_SUPPORT_URL = "https://buymeacoffee.com/footballxvii";
  function wireSupportLinks(){
    document.querySelectorAll('[data-support-link]').forEach(function(link){
      link.href = XVII_SUPPORT_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }
  document.addEventListener('DOMContentLoaded', wireSupportLinks);
