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
    threshold: 0.3, // Dispara quando 30% da seção estiver na tela
    rootMargin: "-80px 0px 0px 0px" // Compensa a altura da navbar
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
  // 5. TRATAMENTO DO FORMULÁRIO DE CONTATO (SIMULAÇÃO + WHATSAPP REDIRECT)
  // ==========================================================================
  const contactForm = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');

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

    // 2. Como recurso profissional alternativo, podemos abrir o WhatsApp pré-preenchido
    // para garantir que a mensagem chegue de qualquer forma na hora.
    const textFormatted = `Olá Daniel! Meu nome é ${encodeURIComponent(name)} (${encodeURIComponent(email)}). Tenho interesse no serviço de *${encodeURIComponent(service)}*. \n\nMensagem: ${encodeURIComponent(message)}`;
    
    // Pergunta opcional após simular o envio se o paciente deseja enviar via WhatsApp para resposta imediata
    setTimeout(() => {
      if (confirm("Deseja abrir o WhatsApp para enviar esta mensagem diretamente para o Dr. Daniel para um retorno mais rápido?")) {
        window.open(`https://wa.me/5511961253511?text=${textFormatted}`, '_blank');
      }
    }, 800);
  });
});
