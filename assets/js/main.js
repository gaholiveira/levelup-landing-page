// Intersection Observer para animações de scroll
(function () {
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("mostrar");
      });
    },
    { threshold: 0.1 }
  );

  document
    .querySelectorAll(".escondido")
    .forEach((el) => observador.observe(el));

  // Configurações Supabase
  const SUPABASE_URL = "https://ofygwnnzwkxiqgnardox.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9meWd3bm56d2t4aXFnbmFyZG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTY5MzIsImV4cCI6MjA4MDk5MjkzMn0.lDkATZdUmXAKnKS6sKPLkXakSpnSoGBar4hFYbphNnI";
  const NUMERO_WHATSAPP = "5516993084235";
  const clienteSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Máscara de telefone
  const inputPhone = document.querySelector('input[type="tel"]');
  if (inputPhone) {
    inputPhone.addEventListener("input", (e) => {
      const x = e.target.value
        .replace(/\D/g, "")
        .match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
      e.target.value = !x[2]
        ? x[1]
        : "(" + x[1] + ") " + x[2] + (x[3] ? "-" + x[3] : "");
    });
  }

  // Formulário
  const form = document.querySelector(".form-grid");
  const btnEnviar = document.querySelector(".btn-full");
  let enviando = false;

  if (form && btnEnviar) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (enviando) return;
      enviando = true;

      const textoOriginal = btnEnviar.innerHTML;
      btnEnviar.innerHTML = "Enviando...";
      btnEnviar.disabled = true;

      const inputs = form.querySelectorAll("input, select");
      const dados = {
        nome: inputs[0].value,
        whatsapp: inputs[1].value,
        email: inputs[2].value,
        faturamento: inputs[3].value,
      };

      try {
        const { error } = await clienteSupabase
          .from("aplicacoes_mentoria")
          .insert([dados]);

        if (error) throw error;

        // Dispara evento de conversão de Lead no Meta Pixel ANTES do redirecionamento
        if (typeof fbq !== "undefined") {
          fbq("track", "Lead");
        }

        // Aguarda um pequeno delay para garantir que o evento do Pixel seja enviado
        // antes do redirecionamento para o WhatsApp
        const mensagem = `Olá! Acabei de preencher o formulário para receber meu *Diagnóstico Grátis*.%0A%0A*Meus dados:*%0A• Nome: *${dados.nome}*%0A• Faturamento atual: ${dados.faturamento}%0A%0AGostaria de agendar minha análise gratuita e descobrir como escalar meu negócio!%0A%0AQual o próximo passo?`;

        // Redireciona após o disparo do evento (delay de 150ms para garantir envio)
        setTimeout(() => {
          window.location.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensagem}`;
        }, 150);

        form.reset();
      } catch (erro) {
        console.error("Erro:", erro);
        const mensagemErro = `Olá, tentei aplicar pelo site mas deu erro. Me chamo ${dados.nome}.`;
        window.location.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensagemErro}`;
      } finally {
        enviando = false;
        btnEnviar.innerHTML = textoOriginal;
        btnEnviar.disabled = false;
      }
    });
  }
})();
