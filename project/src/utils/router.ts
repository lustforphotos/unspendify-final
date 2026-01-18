export const navigate = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export const handleInternalLinkClick = (
  e: React.MouseEvent<HTMLAnchorElement>,
  path: string
) => {
  if (path.startsWith('mailto:') || path.startsWith('#') || path.startsWith('http')) {
    return;
  }
  e.preventDefault();
  navigate(path);
};
