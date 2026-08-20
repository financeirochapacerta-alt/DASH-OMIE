import "server-only";
import type { BankAccountRecord, CategoryRecord, CustomerRecord, SellerRecord } from "@/services/omie/reference-data/types";
import type { FinancialTitleRecord } from "@/services/omie/financial/types";
import type { SalesOrderRecord, ServiceOrderRecord } from "@/services/omie/commercial/types";

export const customerRow=(r:CustomerRecord)=>({legal_name:r.legalName,trade_name:r.tradeName,document_number:r.documentNumber,...(r.isActive===undefined?{}:{is_active:r.isActive})});
export const sellerRow=(r:SellerRecord)=>({name:r.name,email:r.email,...(r.isActive===undefined?{}:{is_active:r.isActive})});
export const categoryRow=(r:CategoryRecord)=>({name:r.name,codigo_dre:r.codigoDre,dre_metadata:r.dreMetadata,...(r.isActive===undefined?{}:{is_active:r.isActive})});
export const bankAccountRow=(r:BankAccountRecord)=>({description:r.description,initial_balance:r.initialBalance,balance_date:r.balanceDate,account_type:r.accountType,...(r.blocked===undefined?{}:{blocked:r.blocked}),...(r.inactive===undefined?{}:{inactive:r.inactive})});
export const financialRow=(r:FinancialTitleRecord)=>({customer_id:r.customerId,seller_id:r.sellerId,category_id:r.categoryId,bank_account_id:r.bankAccountId,due_date:r.dueDate,forecast_date:r.forecastDate,issue_date:r.issueDate,original_value:r.originalValue,status:r.status,document_number:r.documentNumber,installment_number:r.installmentNumber,is_settled:r.isSettled,is_cancelled:r.isCancelled});
export const salesOrderRow=(r:SalesOrderRecord)=>({display_number:r.displayNumber,customer_id:r.customerId,seller_id:r.sellerId,contract_number:r.contractNumber,forecast_date:r.forecastDate,stage_code:r.stageCode,stage_classification:r.stageClassification,total_value:r.totalValue,is_cancelled:r.isCancelled,cancelled_at:r.cancelledAt,invoice_date:r.invoiceDate,real_due_date:r.realDueDate,enrichment_status:r.enrichmentStatus,enriched_at:r.enrichmentStatus==="enriched"?new Date().toISOString():null});
export const serviceOrderRow=(r:ServiceOrderRecord)=>({display_number:r.displayNumber,customer_id:r.customerId,seller_id:r.sellerId,contract_number:r.contractNumber,forecast_date:r.forecastDate,stage_code:r.stageCode,stage_classification:r.stageClassification,total_value:r.totalValue,inclusion_date:r.inclusionDate,invoice_date:r.invoiceDate,is_cancelled:null,real_due_date:null});
