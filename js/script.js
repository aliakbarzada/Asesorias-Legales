// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar EmailJS
    (function(){
        emailjs.init("FKROXwG8610HmsaSQ"); // Reemplaza con tu Public Key de EmailJS
    })();

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav');
    
    mobileMenuBtn.addEventListener('click', function() {
        nav.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        
        if (nav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            nav.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // ✅ Menú dinámico: marcar link activo según página
    const currentPage = window.location.pathname.split('/').pop();
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && currentPage === '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!nav.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
            nav.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header Background on Scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.backgroundColor = 'rgba(30, 58, 138, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.backgroundColor = '#1e3a8a';
        header.style.backdropFilter = 'none';
    }
});

// Contact Form Handling
// Manejo del formulario con EmailJS
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        emailjs.sendForm('service_h289ntr', 'template_h38gure', this, 'FKROXwG8610HmsaSQ')
        .then(() => {
            alert('✅ Tu consulta fue enviada con éxito. Te responderemos pronto.');
            contactForm.reset();
        }, (error) => {
            alert('❌ Ocurrió un error al enviar el correo. Inténtalo nuevamente.');
            console.error('EmailJS Error:', error);
        });
    });
}



// Animaciones scroll
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function handleScrollAnimation() {
    const elements = document.querySelectorAll('.service-card, .update-card, .testimonial-card, .feature');
    
    elements.forEach(element => {
        if (isElementInViewport(element)) {
            element.classList.add('fade-in', 'active');
        }
    });
}

window.addEventListener('scroll', handleScrollAnimation);
window.addEventListener('load', handleScrollAnimation);

// Efecto ripple en botones
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Social Media Links (demo)
document.querySelectorAll('.social-links a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const platform = this.querySelector('i').classList[1].replace('fa-', '');
        alert(`Redirigiendo a nuestra página de ${platform}...`);
    });
});

// ====== FUNCIONALIDAD MODALES ======
document.querySelectorAll(".ver-mas-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.style.display = "flex";
  });
});

document.querySelectorAll(".close-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const modal = btn.closest(".modal");
    if (modal) modal.style.display = "none";
  });
});

window.addEventListener("click", e => {
  document.querySelectorAll(".modal").forEach(modal => {
    if (e.target === modal) modal.style.display = "none";
  });
});


// === CARGAR NORMATIVAS LEGALES ===
async function cargarNormativas() {
  try {
    const response = await fetch('data/ultimas_normativas.json');
    if (!response.ok) throw new Error('No se pudo cargar el archivo JSON.');

    const data = await response.json();
    const contenedor = document.querySelector('.updates-grid');

    if (!contenedor) {
      console.error("⚠️ No se encontró el contenedor .updates-grid en el HTML.");
      return;
    }

    // Limpiar contenido previo
    contenedor.innerHTML = "";

    // Ordenar por fecha o agrupar por tema (opcional)
    const normativas = data.normativas || [];

    normativas.forEach((norma) => {
      const card = document.createElement('div');
      card.classList.add('update-card');

      card.innerHTML = `
        <div class="update-badge">${norma.tema || 'General'}</div>
        <h3 class="update-title">${norma.titulo}</h3>
        <p class="update-desc">${norma.descripcion}</p>
        <a href="${norma.link}" class="update-link" target="_blank">Ver más</a>
      `;

      contenedor.appendChild(card);
    });

    console.log(`✅ ${normativas.length} normativas cargadas en la página.`);
  } catch (error) {
    console.error("❌ Error al cargar las normativas:", error);
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarNormativas);





// script.js

// Menú móvil
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const nav = document.getElementById("nav");
if (mobileMenuBtn && nav) {
  mobileMenuBtn.addEventListener("click", () => {
    nav.classList.toggle("active");
  });
}

// Modales de servicios
const modals = document.querySelectorAll(".modal");
const verMasBtns = document.querySelectorAll(".ver-mas-btn");
const closeBtns = document.querySelectorAll(".close-btn");

verMasBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    document.getElementById(target).style.display = "block";
  });
});

closeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest(".modal").style.display = "none";
  });
});

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
  }
});
