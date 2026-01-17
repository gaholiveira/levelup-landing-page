const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Configurações
const IMG_DIR = "./assets/img";
const SUPPORTED_FORMATS = [".png", ".jpg", ".jpeg"];

/**
 * Determina a qualidade WebP baseada no nome do arquivo
 * @param {string} filename - Nome do arquivo
 * @returns {Object} - Configurações de qualidade { lossless: boolean, quality: number }
 */
function getQualitySettings(filename) {
  const lowerName = filename.toLowerCase();

  // Imagens com números/gráficos: máxima qualidade (lossless)
  if (
    lowerName.includes("print") ||
    lowerName.includes("dashboard") ||
    lowerName.includes("resultado") ||
    lowerName.includes("grafico")
  ) {
    return { lossless: true };
  }

  // Imagens de fundo: compressão maior
  if (
    lowerName.includes("bg") ||
    lowerName.includes("fundo") ||
    lowerName.includes("background")
  ) {
    return { quality: 65 };
  }

  // Fotos de pessoas e outros: qualidade balanceada
  return { quality: 80 };
}

/**
 * Converte uma imagem para WebP
 * @param {string} inputPath - Caminho da imagem original
 * @param {string} outputPath - Caminho de saída WebP
 * @param {Object} qualitySettings - Configurações de qualidade
 * @returns {Promise<Object>} - Estatísticas da conversão
 */
async function convertToWebP(inputPath, outputPath, qualitySettings) {
  try {
    const inputStats = fs.statSync(inputPath);
    const inputSize = inputStats.size;

    await sharp(inputPath)
      .webp(qualitySettings)
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const outputSize = outputStats.size;
    const savedBytes = inputSize - outputSize;
    const savedPercent = ((savedBytes / inputSize) * 100).toFixed(2);

    return {
      success: true,
      inputSize,
      outputSize,
      savedBytes,
      savedPercent,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Formata bytes para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} - Tamanho formatado
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Processa todas as imagens da pasta
 */
async function optimizeImages() {
  console.log("🖼️  Iniciando otimização de imagens...\n");

  if (!fs.existsSync(IMG_DIR)) {
    console.error(`❌ Erro: Pasta ${IMG_DIR} não encontrada!`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMG_DIR);
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return SUPPORTED_FORMATS.includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log("ℹ️  Nenhuma imagem encontrada para converter.\n");
    return;
  }

  console.log(`📁 Encontradas ${imageFiles.length} imagem(ns) para processar:\n`);

  let converted = 0;
  let skipped = 0;
  let errors = 0;
  let totalSaved = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(IMG_DIR, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(IMG_DIR, `${baseName}.webp`);

    // Verifica se já existe versão WebP
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Pulando: ${file} (já existe ${baseName}.webp)`);
      skipped++;
      continue;
    }

    // Determina qualidade baseada no nome
    const qualitySettings = getQualitySettings(file);
    const qualityInfo = qualitySettings.lossless
      ? "lossless"
      : `quality: ${qualitySettings.quality}`;

    console.log(`🔄 Convertendo: ${file} (${qualityInfo})...`);

    const result = await convertToWebP(inputPath, outputPath, qualitySettings);

    if (result.success) {
      converted++;
      totalSaved += result.savedBytes;

      const savedInfo =
        result.savedBytes > 0
          ? `💾 Economizou: ${formatBytes(result.savedBytes)} (${result.savedPercent}%)`
          : `⚠️  Arquivo aumentou: ${formatBytes(Math.abs(result.savedBytes))}`;

      console.log(
        `✅ ${file} → ${baseName}.webp\n   ${formatBytes(result.inputSize)} → ${formatBytes(result.outputSize)}\n   ${savedInfo}\n`
      );
    } else {
      errors++;
      console.error(`❌ Erro ao converter ${file}: ${result.error}\n`);
    }
  }

  // Resumo final
  console.log("=".repeat(50));
  console.log("📊 RESUMO DA CONVERSÃO:");
  console.log("=".repeat(50));
  console.log(`✅ Convertidas: ${converted}`);
  console.log(`⏭️  Puladas: ${skipped}`);
  console.log(`❌ Erros: ${errors}`);
  if (totalSaved > 0) {
    console.log(`💾 Total economizado: ${formatBytes(totalSaved)}`);
  }
  console.log("=".repeat(50));
}

// Executa o script
optimizeImages().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
