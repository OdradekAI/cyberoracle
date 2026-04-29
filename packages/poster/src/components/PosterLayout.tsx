interface PosterSection {
  heading: string;
  content: string;
}

interface PosterLayoutProps {
  title: string;
  sections: PosterSection[];
  footer?: string;
  width?: number;
}

export function PosterLayout({ title, sections, footer }: Omit<PosterLayoutProps, 'width'>) {
  const padding = 48;
  const sectionGap = 24;

  const sectionElements = sections.flatMap((section, i) => {
    const elements: Record<string, unknown>[] = [];
    if (i > 0) {
      elements.push({
        type: 'div',
        props: {
          style: {
            width: '60%',
            height: 2,
            backgroundColor: '#9A7B3F',
            margin: `${sectionGap}px auto`,
          },
        },
      });
    }
    elements.push({
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column' as const,
          marginBottom: sectionGap,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: 22,
                fontWeight: 600,
                color: '#1F1B16',
                marginBottom: 8,
              },
              children: section.heading,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: 16,
                color: '#1F1B16',
                lineHeight: 1.6,
                opacity: 0.85,
              },
              children: section.content,
            },
          },
        ],
      },
    });
    return elements;
  });

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F8F5EE',
        padding,
        display: 'flex',
        flexDirection: 'column' as const,
        fontFamily: 'Noto Serif SC, serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: 32,
              fontWeight: 700,
              color: '#1F1B16',
              textAlign: 'center' as const,
              marginBottom: 32,
            },
            children: title,
          },
        },
        ...sectionElements,
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'flex-end' as const,
              marginTop: 'auto',
              paddingTop: 16,
            },
            children: footer
              ? {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 12,
                      color: '#9A7B3F',
                      opacity: 0.7,
                    },
                    children: footer,
                  },
                }
              : {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 10,
                      color: '#9A7B3F',
                      opacity: 0.5,
                    },
                    children: 'CyberOracle',
                  },
                },
          },
        },
      ],
    },
  };
}
