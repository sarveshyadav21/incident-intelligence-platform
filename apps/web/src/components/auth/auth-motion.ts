export const authEase = [0.22, 1, 0.36, 1] as const;

export const authShellVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.12,
    },
  },
};

export const authItemVariants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: authEase },
  },
};

export const authCardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: authEase },
  },
};

export const authFieldVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: authEase },
  },
};

export const authDividerVariants = {
  hidden: { opacity: 0, scaleX: 0.6 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.45, ease: authEase },
  },
};
