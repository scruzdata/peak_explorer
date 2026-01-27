'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registro de plugins de GSAP en entorno cliente
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
}

export function BlogParallaxHero() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const tl = gsap
      .timeline({
        scrollTrigger: {
          trigger: '.blog-parallax-scrollDist',
          start: '0 0',
          end: '100% 100%',
          scrub: 1,
        },
      })
      .fromTo('.blog-parallax-sky', { y: 0 }, { y: -200 }, 0)
      .fromTo('.blog-parallax-cloud1', { y: 100 }, { y: -800 }, 0)
      .fromTo('.blog-parallax-cloud2', { y: -150 }, { y: -500 }, 0)
      .fromTo('.blog-parallax-cloud3', { y: -50 }, { y: -650 }, 0)
      .fromTo('.blog-parallax-mountBg', { y: -10 }, { y: -100 }, 0)
      .fromTo('.blog-parallax-mountMg', { y: -30 }, { y: -250 }, 0)
      .fromTo('.blog-parallax-mountFg', { y: -50 }, { y: -600 }, 0)

    const arrowBtn = document.querySelector<SVGRectElement>(
      '#blog-parallax-arrow-btn',
    )

    const handleMouseEnter = () => {
      gsap.to('.blog-parallax-arrow', {
        y: 10,
        duration: 0.8,
        ease: 'back.inOut(3)',
        overwrite: 'auto',
      })
    }

    const handleMouseLeave = () => {
      gsap.to('.blog-parallax-arrow', {
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }

    const handleClick = () => {
      const target = document.querySelector<HTMLElement>('#blog-list')
      const y =
        (target?.getBoundingClientRect().top ?? 0) + window.scrollY

      gsap.to(window, {
        scrollTo: y,
        duration: 1.2,
        ease: 'power1.inOut',
      })
    }

    if (arrowBtn) {
      arrowBtn.addEventListener('mouseenter', handleMouseEnter)
      arrowBtn.addEventListener('mouseleave', handleMouseLeave)
      arrowBtn.addEventListener('click', handleClick)
    }

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()

      if (arrowBtn) {
        arrowBtn.removeEventListener('mouseenter', handleMouseEnter)
        arrowBtn.removeEventListener('mouseleave', handleMouseLeave)
        arrowBtn.removeEventListener('click', handleClick)
      }
    }
  }, [])

  return (
    <section className="blog-parallax-wrapper">
      <div className="blog-parallax-scrollDist" />
      <main className="blog-parallax-main">
        {/* Recreación del efecto parallax original adaptado a React */}
        <svg
          viewBox="0 0 1200 800"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          preserveAspectRatio="xMidYMid slice"
        >
          <mask id="blog-parallax-mask">
            <g className="blog-parallax-cloud1">
              <rect fill="#fff" width="100%" height="801" y="799" />
              <image
                href="https://assets.codepen.io/721952/cloud1Mask.jpg"
                width="1200"
                height="800"
              />
            </g>
          </mask>

          <image
            className="blog-parallax-sky"
            href="https://assets.codepen.io/721952/sky.jpg"
            width="1200"
            height="590"
          />
          <image
            className="blog-parallax-mountBg"
            href="https://assets.codepen.io/721952/mountBg.png"
            width="1200"
            height="800"
          />
          <image
            className="blog-parallax-mountMg"
            href="https://assets.codepen.io/721952/mountMg.png"
            width="1200"
            height="800"
          />
          <image
            className="blog-parallax-cloud2"
            href="https://assets.codepen.io/721952/cloud2.png"
            width="1200"
            height="800"
          />
          <image
            className="blog-parallax-mountFg"
            href="https://assets.codepen.io/721952/mountFg.png"
            width="1200"
            height="800"
          />
          <image
            className="blog-parallax-cloud1"
            href="https://assets.codepen.io/721952/cloud1.png"
            width="1200"
            height="800"
          />
          <image
            className="blog-parallax-cloud3"
            href="https://assets.codepen.io/721952/cloud3.png"
            width="1200"
            height="800"
          />
          <text
            fill="#fff"
            x="50%"
            y="200"
            textAnchor="middle"
          >
            {/* EXPLORE */}
          </text>
          {/* <polyline
            className="blog-parallax-arrow"
            fill="#fff"
            points="599,250 599,289 590,279 590,282 600,292 610,282 610,279 601,289 601,250"
          /> */}

          <g mask="url(#blog-parallax-mask)">
            <rect fill="#fff" width="100%" height="100%" />
            <text
              x="50%"
              y="10%"
              fill="#162a43"
              textAnchor="middle"
            >
              FURTHER
            </text>
          </g>

          <rect
            id="blog-parallax-arrow-btn"
            width="100"
            height="100"
            opacity="0"
            x="550"
            y="250"
            style={{ cursor: 'pointer' }}
          />
        </svg>
      </main>
    </section>
  )
}

