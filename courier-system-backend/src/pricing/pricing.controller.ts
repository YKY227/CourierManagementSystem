// src/pricing/pricing.controller.ts
import { Body, Controller, Get, Logger, Post, Put } from "@nestjs/common";
import { PricingService } from "./pricing.service";
import { PricingQuoteRequestDto } from "./dto/pricing-quote.dto";

@Controller()
export class PricingController {
  private readonly logger = new Logger(PricingController.name);

  constructor(private pricingService: PricingService) {}

  // Public quote endpoint: POST /pricing/quote
  @Post("pricing/quote")
  async getQuote(@Body() body: PricingQuoteRequestDto) {
    this.logger.log("POST /pricing/quote called");
    const quote = await this.pricingService.calculateQuote(body);
    return quote;
  }

  // Admin get current pricing config: GET /admin/pricing
  @Get("admin/pricing")
  async getAdminConfig() {
    return this.pricingService.getConfigForAdmin();
  }

  // Admin update pricing config: PUT /admin/pricing
  @Put("admin/pricing")
  async updateAdminConfig(@Body() body: any) {
    // For now, accept partial body and trust admin UI.
    // Later we can add DTO + validation here.
    const updated = await this.pricingService.updateConfigFromAdmin(body);
    return updated;
  }
}
