#!/usr/bin/env node

// Asset Optimization Script for Chase n' Phrase
// Compresses images, generates WebP versions, and optimizes assets

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface OptimizationConfig {
  inputDir: string;
  outputDir: string;
  quality: number;
  webpQuality: number;
  maxWidth?: number;
  maxHeight?: number;
}

class AssetOptimizer {
  private config: OptimizationConfig;

  constructor(config: OptimizationConfig) {
    this.config = config;
  }

  public async optimizeAssets(): Promise<void> {
    
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    // Process all image files
    await this.processDirectory(this.config.inputDir);
  }

  private async processDirectory(dirPath: string): Promise<void> {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Create corresponding output directory
        const relativePath = path.relative(this.config.inputDir, fullPath);
        const outputPath = path.join(this.config.outputDir, relativePath);
        
        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath, { recursive: true });
        }
        
        await this.processDirectory(fullPath);
      } else if (this.isImageFile(item)) {
        await this.optimizeImage(fullPath);
      } else if (this.isAudioFile(item)) {
        await this.optimizeAudio(fullPath);
      }
    }
  }

  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private isAudioFile(filename: string): boolean {
    const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.aac'];
    return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private async optimizeImage(inputPath: string): Promise<void> {
    try {
      const relativePath = path.relative(this.config.inputDir, inputPath);
      const outputPath = path.join(this.config.outputDir, relativePath);
      const webpPath = outputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      
      // Optimize original image
      await this.compressImage(inputPath, outputPath);
      
      // Generate WebP version
      await this.generateWebP(inputPath, webpPath);
      
    } catch (error) {
      console.error(`❌ Failed to optimize image ${inputPath}:`, error);
    }
  }

  private async compressImage(inputPath: string, outputPath: string): Promise<void> {
    const ext = path.extname(inputPath).toLowerCase();
    
    try {
      if (ext === '.png') {
        // Use pngquant for PNG compression
        execSync(`pngquant --quality=${this.config.quality}-100 --force --output "${outputPath}" "${inputPath}"`, {
          stdio: 'pipe'
        });
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        // Use jpegoptim for JPEG compression
        execSync(`jpegoptim --max=${this.config.quality} --force "${inputPath}" --dest="${path.dirname(outputPath)}"`, {
          stdio: 'pipe'
        });
        // Copy to output path
        fs.copyFileSync(inputPath, outputPath);
      } else {
        // Copy other formats as-is
        fs.copyFileSync(inputPath, outputPath);
      }
    } catch (error) {
      console.warn(`⚠️ Compression failed for ${inputPath}, copying original:`, error);
      fs.copyFileSync(inputPath, outputPath);
    }
  }

  private async generateWebP(inputPath: string, outputPath: string): Promise<void> {
    try {
      const ext = path.extname(inputPath).toLowerCase();
      
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        execSync(`cwebp -q ${this.config.webpQuality} "${inputPath}" -o "${outputPath}"`, {
          stdio: 'pipe'
        });
      }
    } catch (error) {
      console.warn(`⚠️ WebP generation failed for ${inputPath}:`, error);
    }
  }

  private async optimizeAudio(inputPath: string): Promise<void> {
    try {
      const relativePath = path.relative(this.config.inputDir, inputPath);
      const outputPath = path.join(this.config.outputDir, relativePath);
      
      // Copy audio files as-is for now (can add compression later)
      fs.copyFileSync(inputPath, outputPath);
      
    } catch (error) {
      console.error(`❌ Failed to optimize audio ${inputPath}:`, error);
    }
  }
}

// Main execution
async function main() {
  // Fix Windows path issue by using process.cwd() instead
  const projectRoot = process.cwd();
  const config: OptimizationConfig = {
    inputDir: path.join(projectRoot, 'src/client/public'),
    outputDir: path.join(projectRoot, 'dist/client'),
    quality: 85,
    webpQuality: 80,
    maxWidth: 1920,
    maxHeight: 1080
  };

  const optimizer = new AssetOptimizer(config);
  await optimizer.optimizeAssets();
}

// Run if called directly
main().catch(console.error);

export { AssetOptimizer };

