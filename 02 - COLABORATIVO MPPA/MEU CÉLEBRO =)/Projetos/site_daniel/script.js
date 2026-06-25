document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. GERENCIAMENTO DE TEMA (CLARO/ESCURO)
  // ==========================================================================
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  // Carregar tema preferido do localStorage
  const savedTheme = localStorage.getItem('daniel-site-theme') || 'light';
  if (savedTheme === 'dark') {
    body.classList.add('theme-dark');
  } else {
    body.classList.remove('theme-dark');
  }

  // Evento de clique para alternar
  themeToggle.addEventListener('click', () => {
    body.classList.toggle('theme-dark');
    const isDark = body.classList.contains('theme-dark');
    localStorage.setItem('daniel-site-theme', isDark ? 'dark' : 'light');
  });

  // ==========================================================================
  // 2. NAVBAR SCROLL EFFECT
  // ==========================================================================
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ==========================================================================
  // 3. MENU MOBILE (HAMBURGUER)
  // ==========================================================================
  const menuHamburger = document.getElementById('menu-hamburger');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  menuHamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    menuHamburger.classList.toggle('active');
  });

  // Fechar menu mobile ao clicar em qualquer link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      menuHamburger.classList.remove('active');
    });
  });

  // ==========================================================================
  // 4. SCROLLSPY (INDICADOR ATIVO NA NAVBAR)
  // ==========================================================================
  const sections = document.querySelectorAll('section');
  const scrollspyOptions = {
    root: null,
    threshold: 0.25, // Dispara quando 25% da seção estiver na tela
    rootMargin: "-80px 0px 0px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, scrollspyOptions);

  sections.forEach(section => {
    observer.observe(section);
  });

  // ==========================================================================
  // 4. REVEAL ANIMATION (FADE-IN AO SCROLL)
  // ==========================================================================
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => revealObserver.observe(el));

  // ==========================================================================
  // 5. ANIMAÇÃO DE BARRAS DE ESTATÍSTICA (INSIGHTS)
  // ==========================================================================
  const chartSection = document.getElementById('insights');
  const barFills = document.querySelectorAll('.animate-bar');

  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        barFills.forEach(bar => {
          const targetWidth = bar.getAttribute('data-width');
          bar.style.width = targetWidth;
        });
        // Para rodar a animação apenas uma vez
        chartObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  if (chartSection) {
    chartObserver.observe(chartSection);
  }

  // ==========================================================================
  // 6. MODAL DE LEITURA DO BLOG
  // ==========================================================================
  const blogModal = document.getElementById('blog-modal');
  const blogModalClose = document.getElementById('blog-modal-close');
  const blogModalBody = document.getElementById('blog-modal-body');

  window.openPostModal = function(postId) {
    const template = document.getElementById(`post-${postId}-template`);
    if (!template) return;

    // Clona o conteúdo do template
    const clone = template.content.cloneNode(true);
    
    // Limpa o body e insere o novo conteúdo
    blogModalBody.innerHTML = '';
    blogModalBody.appendChild(clone);
    
    // Abre o modal
    blogModal.classList.add('open');
    body.style.overflow = 'hidden'; // Impede o scroll de fundo
  };

  function closePostModal() {
    blogModal.classList.remove('open');
    body.style.overflow = ''; // Restaura o scroll de fundo
    // Pequeno delay para limpar os dados após fechar (efeito de fade-out)
    setTimeout(() => {
      blogModalBody.innerHTML = '';
    }, 300);
  }

  if (blogModalClose) {
    blogModalClose.addEventListener('click', closePostModal);
  }

  // Fechar clicando fora do conteúdo do modal
  if (blogModal) {
    blogModal.addEventListener('click', (e) => {
      if (e.target === blogModal) {
        closePostModal();
      }
    });
  }

  // Fechar pressionando tecla Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && blogModal.classList.contains('open')) {
      closePostModal();
    }
  });

  // ==========================================================================
  // 7. TRATAMENTO DO FORMULÁRIO DE CONTATO (SIMULAÇÃO + WHATSAPP REDIRECT)
  // ==========================================================================
  const contactForm = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('form-name').value;
      const email = document.getElementById('form-email').value;
      const service = document.getElementById('form-service').value;
      const message = document.getElementById('form-message').value;

      // 1. Mostrar feedback de envio bem-sucedido na tela
      successMsg.style.display = 'block';
      contactForm.reset();

      // Sumir feedback de sucesso após 5 segundos
      setTimeout(() => {
        successMsg.style.display = 'none';
      }, 5000);

      // 2. Formatar mensagem detalhada para WhatsApp
      const textFormatted = `Olá Daniel! Meu nome é ${encodeURIComponent(name)} (${encodeURIComponent(email)}). Tenho interesse no serviço de *${encodeURIComponent(service)}*. \n\nMensagem: ${encodeURIComponent(message)}`;
      
      // Oferece abertura no WhatsApp com feedback imediato
      setTimeout(() => {
        if (confirm("Deseja abrir o WhatsApp para enviar esta mensagem diretamente para o Dr. Daniel para um retorno mais rápido?")) {
          window.open(`https://wa.me/5511961253511?text=${textFormatted}`, '_blank');
        }
      }, 800);
    });
  }
});
