---
# Leave the homepage title empty to use the site title
title:
date: 2025-01-01
type: landing

design:
  # Default section spacing
  spacing: '6rem'

sections:
  - block: resume-biography-3
    content:
      # Choose a user profile to display (a folder name in `content/authors/`)
      username: admin
      text: ''
      # Show a call-to-action button under your biography? (optional)
      button:
        text: Download CV
        url: uploads/cv.pdf
    design:
      css_class: dark
      background:
        color: black
        image:
          # Add your image background to `assets/media/`.
          filename: bg-triangles.svg
          filters:
            brightness: 1.0
          size: cover
          position: center
          parallax: false

  - block: markdown
    id: research
    content:
      title: 'Research Interests'
      subtitle: ''
      text: |-
        My research focuses on three interconnected areas:

        **Robust Divergence Methods** — Developing statistically robust estimators based on $f$-divergences and Rényi divergences that remain reliable under model misspecification and heavy-tailed distributions.

        **Generative Model Alignment** — Studying theoretical foundations and practical algorithms for aligning large generative models (LLMs, diffusion models) with human preferences, with an emphasis on principled divergence-based objectives.

        **Statistical Learning Theory** — Investigating generalization bounds, minimax rates, and information-theoretic limits for modern machine learning paradigms.
    design:
      columns: '1'

  - block: collection
    id: publications
    content:
      title: Publications
      text: ''
      filters:
        folders:
          - publication
        exclude_featured: false
    design:
      view: citation
      columns: '1'

  - block: markdown
    id: patents
    content:
      title: Patents
      subtitle: ''
      text: |-
        **一种基于图表示学习模型的油品输送管道混油段预测方法**
        *A Graph Representation Learning-Based Method for Predicting Mixed Oil Interfaces in Pipeline Transportation*

        - **Publication No.:** CN 121327408 A
        - **Inventors:** Xinyi Hong (洪心驿), Ziqi Chen (谌自奇), Yanfeng Yang (杨彦丰), Miaomiao Yu (郁淼淼)
        - **Status:** Patent application published
    design:
      columns: '1'

  - block: resume-skills
    id: skills
    content:
      title: Skills & Tools
      username: admin
    design:
      show_skill_percentage: false
---
