-- =============================================================================
-- REPLENISHMENT REPORT WITH FULL BRANCH PIVOT
-- Compatible with MySQL 5.x (No CTE, using nested subqueries)
-- =============================================================================

SELECT 
    fm.inv_type AS kode_item,
    ti.name AS nama_item,
    fm.hpp_ref AS hpp_ref,
    
    -- ==========================================
    -- TOTAL NASIONAL (SUMMARY)
    -- ==========================================
    SUM(s_m0) AS Total_Sales_M0,
    SUM(s_m1) AS Total_Sales_M1,
    SUM(s_m2) AS Total_Sales_M2,
    SUM(s_m3) AS Total_Sales_M3,
    
    SUM(l_m0) AS Total_Lain_M0,
    SUM(l_m1) AS Total_Lain_M1,
    SUM(l_m2) AS Total_Lain_M2,
    SUM(l_m3) AS Total_Lain_M3,
    
    SUM(current_qty) AS Total_Stock,
    ROUND(SUM(replenishment_qty), 2) AS Total_Replenishment,
    ROUND(AVG(CASE WHEN avg_flow > 0 THEN doi_months END), 2) AS Avg_DOI_Months,

    -- ==========================================
    -- PER BRANCH (ALL IN ONE!) 🚀
    -- Format: [BRANCH]_Stock, [BRANCH]_Sales_M0-M3, [BRANCH]_Lain_M0-M3, [BRANCH]_Replenish, [BRANCH]_DOI
    -- ==========================================

    -- === 1. JKT ===
    SUM(CASE WHEN branch_id = 'JKT' THEN current_qty ELSE 0 END) AS JKT_Stock,
    SUM(CASE WHEN branch_id = 'JKT' THEN s_m0 ELSE 0 END) AS JKT_Sales_M0,
    SUM(CASE WHEN branch_id = 'JKT' THEN s_m1 ELSE 0 END) AS JKT_Sales_M1,
    SUM(CASE WHEN branch_id = 'JKT' THEN s_m2 ELSE 0 END) AS JKT_Sales_M2,
    SUM(CASE WHEN branch_id = 'JKT' THEN s_m3 ELSE 0 END) AS JKT_Sales_M3,
    SUM(CASE WHEN branch_id = 'JKT' THEN l_m0 ELSE 0 END) AS JKT_Lain_M0,
    SUM(CASE WHEN branch_id = 'JKT' THEN l_m1 ELSE 0 END) AS JKT_Lain_M1,
    SUM(CASE WHEN branch_id = 'JKT' THEN l_m2 ELSE 0 END) AS JKT_Lain_M2,
    SUM(CASE WHEN branch_id = 'JKT' THEN l_m3 ELSE 0 END) AS JKT_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'JKT' THEN replenishment_qty ELSE 0 END), 2) AS JKT_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'JKT' AND avg_flow > 0 THEN doi_months END), 2) AS JKT_DOI,

    -- === 2. SBY ===
    SUM(CASE WHEN branch_id = 'SBY' THEN current_qty ELSE 0 END) AS SBY_Stock,
    SUM(CASE WHEN branch_id = 'SBY' THEN s_m0 ELSE 0 END) AS SBY_Sales_M0,
    SUM(CASE WHEN branch_id = 'SBY' THEN s_m1 ELSE 0 END) AS SBY_Sales_M1,
    SUM(CASE WHEN branch_id = 'SBY' THEN s_m2 ELSE 0 END) AS SBY_Sales_M2,
    SUM(CASE WHEN branch_id = 'SBY' THEN s_m3 ELSE 0 END) AS SBY_Sales_M3,
    SUM(CASE WHEN branch_id = 'SBY' THEN l_m0 ELSE 0 END) AS SBY_Lain_M0,
    SUM(CASE WHEN branch_id = 'SBY' THEN l_m1 ELSE 0 END) AS SBY_Lain_M1,
    SUM(CASE WHEN branch_id = 'SBY' THEN l_m2 ELSE 0 END) AS SBY_Lain_M2,
    SUM(CASE WHEN branch_id = 'SBY' THEN l_m3 ELSE 0 END) AS SBY_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'SBY' THEN replenishment_qty ELSE 0 END), 2) AS SBY_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'SBY' AND avg_flow > 0 THEN doi_months END), 2) AS SBY_DOI,

    -- === 3. SMG ===
    SUM(CASE WHEN branch_id = 'SMG' THEN current_qty ELSE 0 END) AS SMG_Stock,
    SUM(CASE WHEN branch_id = 'SMG' THEN s_m0 ELSE 0 END) AS SMG_Sales_M0,
    SUM(CASE WHEN branch_id = 'SMG' THEN s_m1 ELSE 0 END) AS SMG_Sales_M1,
    SUM(CASE WHEN branch_id = 'SMG' THEN s_m2 ELSE 0 END) AS SMG_Sales_M2,
    SUM(CASE WHEN branch_id = 'SMG' THEN s_m3 ELSE 0 END) AS SMG_Sales_M3,
    SUM(CASE WHEN branch_id = 'SMG' THEN l_m0 ELSE 0 END) AS SMG_Lain_M0,
    SUM(CASE WHEN branch_id = 'SMG' THEN l_m1 ELSE 0 END) AS SMG_Lain_M1,
    SUM(CASE WHEN branch_id = 'SMG' THEN l_m2 ELSE 0 END) AS SMG_Lain_M2,
    SUM(CASE WHEN branch_id = 'SMG' THEN l_m3 ELSE 0 END) AS SMG_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'SMG' THEN replenishment_qty ELSE 0 END), 2) AS SMG_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'SMG' AND avg_flow > 0 THEN doi_months END), 2) AS SMG_DOI,

    -- === 4. MDN ===
    SUM(CASE WHEN branch_id = 'MDN' THEN current_qty ELSE 0 END) AS MDN_Stock,
    SUM(CASE WHEN branch_id = 'MDN' THEN s_m0 ELSE 0 END) AS MDN_Sales_M0,
    SUM(CASE WHEN branch_id = 'MDN' THEN s_m1 ELSE 0 END) AS MDN_Sales_M1,
    SUM(CASE WHEN branch_id = 'MDN' THEN s_m2 ELSE 0 END) AS MDN_Sales_M2,
    SUM(CASE WHEN branch_id = 'MDN' THEN s_m3 ELSE 0 END) AS MDN_Sales_M3,
    SUM(CASE WHEN branch_id = 'MDN' THEN l_m0 ELSE 0 END) AS MDN_Lain_M0,
    SUM(CASE WHEN branch_id = 'MDN' THEN l_m1 ELSE 0 END) AS MDN_Lain_M1,
    SUM(CASE WHEN branch_id = 'MDN' THEN l_m2 ELSE 0 END) AS MDN_Lain_M2,
    SUM(CASE WHEN branch_id = 'MDN' THEN l_m3 ELSE 0 END) AS MDN_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'MDN' THEN replenishment_qty ELSE 0 END), 2) AS MDN_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'MDN' AND avg_flow > 0 THEN doi_months END), 2) AS MDN_DOI,

    -- === 5. HO ===
    SUM(CASE WHEN branch_id = 'HO' THEN current_qty ELSE 0 END) AS HO_Stock,
    SUM(CASE WHEN branch_id = 'HO' THEN s_m0 ELSE 0 END) AS HO_Sales_M0,
    SUM(CASE WHEN branch_id = 'HO' THEN s_m1 ELSE 0 END) AS HO_Sales_M1,
    SUM(CASE WHEN branch_id = 'HO' THEN s_m2 ELSE 0 END) AS HO_Sales_M2,
    SUM(CASE WHEN branch_id = 'HO' THEN s_m3 ELSE 0 END) AS HO_Sales_M3,
    SUM(CASE WHEN branch_id = 'HO' THEN l_m0 ELSE 0 END) AS HO_Lain_M0,
    SUM(CASE WHEN branch_id = 'HO' THEN l_m1 ELSE 0 END) AS HO_Lain_M1,
    SUM(CASE WHEN branch_id = 'HO' THEN l_m2 ELSE 0 END) AS HO_Lain_M2,
    SUM(CASE WHEN branch_id = 'HO' THEN l_m3 ELSE 0 END) AS HO_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'HO' THEN replenishment_qty ELSE 0 END), 2) AS HO_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'HO' AND avg_flow > 0 THEN doi_months END), 2) AS HO_DOI,

    -- === 6. MKS ===
    SUM(CASE WHEN branch_id = 'MKS' THEN current_qty ELSE 0 END) AS MKS_Stock,
    SUM(CASE WHEN branch_id = 'MKS' THEN s_m0 ELSE 0 END) AS MKS_Sales_M0,
    SUM(CASE WHEN branch_id = 'MKS' THEN s_m1 ELSE 0 END) AS MKS_Sales_M1,
    SUM(CASE WHEN branch_id = 'MKS' THEN s_m2 ELSE 0 END) AS MKS_Sales_M2,
    SUM(CASE WHEN branch_id = 'MKS' THEN s_m3 ELSE 0 END) AS MKS_Sales_M3,
    SUM(CASE WHEN branch_id = 'MKS' THEN l_m0 ELSE 0 END) AS MKS_Lain_M0,
    SUM(CASE WHEN branch_id = 'MKS' THEN l_m1 ELSE 0 END) AS MKS_Lain_M1,
    SUM(CASE WHEN branch_id = 'MKS' THEN l_m2 ELSE 0 END) AS MKS_Lain_M2,
    SUM(CASE WHEN branch_id = 'MKS' THEN l_m3 ELSE 0 END) AS MKS_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'MKS' THEN replenishment_qty ELSE 0 END), 2) AS MKS_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'MKS' AND avg_flow > 0 THEN doi_months END), 2) AS MKS_DOI,

    -- === 7. BJM ===
    SUM(CASE WHEN branch_id = 'BJM' THEN current_qty ELSE 0 END) AS BJM_Stock,
    SUM(CASE WHEN branch_id = 'BJM' THEN s_m0 ELSE 0 END) AS BJM_Sales_M0,
    SUM(CASE WHEN branch_id = 'BJM' THEN s_m1 ELSE 0 END) AS BJM_Sales_M1,
    SUM(CASE WHEN branch_id = 'BJM' THEN s_m2 ELSE 0 END) AS BJM_Sales_M2,
    SUM(CASE WHEN branch_id = 'BJM' THEN s_m3 ELSE 0 END) AS BJM_Sales_M3,
    SUM(CASE WHEN branch_id = 'BJM' THEN l_m0 ELSE 0 END) AS BJM_Lain_M0,
    SUM(CASE WHEN branch_id = 'BJM' THEN l_m1 ELSE 0 END) AS BJM_Lain_M1,
    SUM(CASE WHEN branch_id = 'BJM' THEN l_m2 ELSE 0 END) AS BJM_Lain_M2,
    SUM(CASE WHEN branch_id = 'BJM' THEN l_m3 ELSE 0 END) AS BJM_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'BJM' THEN replenishment_qty ELSE 0 END), 2) AS BJM_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'BJM' AND avg_flow > 0 THEN doi_months END), 2) AS BJM_DOI,

    -- === 8. PKU ===
    SUM(CASE WHEN branch_id = 'PKU' THEN current_qty ELSE 0 END) AS PKU_Stock,
    SUM(CASE WHEN branch_id = 'PKU' THEN s_m0 ELSE 0 END) AS PKU_Sales_M0,
    SUM(CASE WHEN branch_id = 'PKU' THEN s_m1 ELSE 0 END) AS PKU_Sales_M1,
    SUM(CASE WHEN branch_id = 'PKU' THEN s_m2 ELSE 0 END) AS PKU_Sales_M2,
    SUM(CASE WHEN branch_id = 'PKU' THEN s_m3 ELSE 0 END) AS PKU_Sales_M3,
    SUM(CASE WHEN branch_id = 'PKU' THEN l_m0 ELSE 0 END) AS PKU_Lain_M0,
    SUM(CASE WHEN branch_id = 'PKU' THEN l_m1 ELSE 0 END) AS PKU_Lain_M1,
    SUM(CASE WHEN branch_id = 'PKU' THEN l_m2 ELSE 0 END) AS PKU_Lain_M2,
    SUM(CASE WHEN branch_id = 'PKU' THEN l_m3 ELSE 0 END) AS PKU_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'PKU' THEN replenishment_qty ELSE 0 END), 2) AS PKU_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'PKU' AND avg_flow > 0 THEN doi_months END), 2) AS PKU_DOI,

    -- === 9. DPS ===
    SUM(CASE WHEN branch_id = 'DPS' THEN current_qty ELSE 0 END) AS DPS_Stock,
    SUM(CASE WHEN branch_id = 'DPS' THEN s_m0 ELSE 0 END) AS DPS_Sales_M0,
    SUM(CASE WHEN branch_id = 'DPS' THEN s_m1 ELSE 0 END) AS DPS_Sales_M1,
    SUM(CASE WHEN branch_id = 'DPS' THEN s_m2 ELSE 0 END) AS DPS_Sales_M2,
    SUM(CASE WHEN branch_id = 'DPS' THEN s_m3 ELSE 0 END) AS DPS_Sales_M3,
    SUM(CASE WHEN branch_id = 'DPS' THEN l_m0 ELSE 0 END) AS DPS_Lain_M0,
    SUM(CASE WHEN branch_id = 'DPS' THEN l_m1 ELSE 0 END) AS DPS_Lain_M1,
    SUM(CASE WHEN branch_id = 'DPS' THEN l_m2 ELSE 0 END) AS DPS_Lain_M2,
    SUM(CASE WHEN branch_id = 'DPS' THEN l_m3 ELSE 0 END) AS DPS_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'DPS' THEN replenishment_qty ELSE 0 END), 2) AS DPS_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'DPS' AND avg_flow > 0 THEN doi_months END), 2) AS DPS_DOI,

    -- === 10. PLG ===
    SUM(CASE WHEN branch_id = 'PLG' THEN current_qty ELSE 0 END) AS PLG_Stock,
    SUM(CASE WHEN branch_id = 'PLG' THEN s_m0 ELSE 0 END) AS PLG_Sales_M0,
    SUM(CASE WHEN branch_id = 'PLG' THEN s_m1 ELSE 0 END) AS PLG_Sales_M1,
    SUM(CASE WHEN branch_id = 'PLG' THEN s_m2 ELSE 0 END) AS PLG_Sales_M2,
    SUM(CASE WHEN branch_id = 'PLG' THEN s_m3 ELSE 0 END) AS PLG_Sales_M3,
    SUM(CASE WHEN branch_id = 'PLG' THEN l_m0 ELSE 0 END) AS PLG_Lain_M0,
    SUM(CASE WHEN branch_id = 'PLG' THEN l_m1 ELSE 0 END) AS PLG_Lain_M1,
    SUM(CASE WHEN branch_id = 'PLG' THEN l_m2 ELSE 0 END) AS PLG_Lain_M2,
    SUM(CASE WHEN branch_id = 'PLG' THEN l_m3 ELSE 0 END) AS PLG_Lain_M3,
    ROUND(SUM(CASE WHEN branch_id = 'PLG' THEN replenishment_qty ELSE 0 END), 2) AS PLG_Replenish,
    ROUND(AVG(CASE WHEN branch_id = 'PLG' AND avg_flow > 0 THEN doi_months END), 2) AS PLG_DOI

FROM (
    -- =============================================================================
    -- SUBQUERY: CALCULATE REPLENISHMENT & DOI
    -- =============================================================================
    SELECT 
        cv.*,
        (avg_flow * buffer_val) - current_qty AS replenishment_qty,
        CASE WHEN avg_flow > 0 THEN current_qty / avg_flow ELSE NULL END AS doi_months
    FROM (
        -- =============================================================================
        -- SUBQUERY: CALCULATE METRICS PER ITEM PER BRANCH
        -- =============================================================================
        SELECT 
            t.inv_type,
            t.branch_id,
            MAX(t.hpp_ref) AS hpp_ref,
            
            SUM(sales_m0) as s_m0, SUM(sales_m1) as s_m1, SUM(sales_m2) as s_m2, SUM(sales_m3) as s_m3,
            SUM(lain_m0) as l_m0, SUM(lain_m1) as l_m1, SUM(lain_m2) as l_m2, SUM(lain_m3) as l_m3,
            
            COALESCE(MAX(stk.current_qty), 0) AS current_qty,
            COALESCE(MAX(bc.buffer_bulan), 0) AS buffer_val,
            
            ((SUM(sales_m1)+SUM(sales_m2)+SUM(sales_m3)) + (SUM(lain_m1)+SUM(lain_m2)+SUM(lain_m3))) / 3.0 AS avg_flow
            
        FROM (
            -- =============================================================================
            -- SUBQUERY: COLLECT ALL TRANSACTIONS (SALES + PENGELUARAN LAIN)
            -- =============================================================================
            SELECT 
                ttd.inv_type,
                ttm.branch_id,
                0 AS hpp_ref,
                
                SUM(CASE WHEN ts.dinvoice >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') AND ts.dinvoice < DATE_ADD(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) THEN ttd.quantity ELSE 0 END) AS sales_m0,
                SUM(CASE WHEN ts.dinvoice >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) AND ts.dinvoice < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN ttd.quantity ELSE 0 END) AS sales_m1,
                SUM(CASE WHEN ts.dinvoice >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 2 MONTH) AND ts.dinvoice < DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) THEN ttd.quantity ELSE 0 END) AS sales_m2,
                SUM(CASE WHEN ts.dinvoice >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 3 MONTH) AND ts.dinvoice < DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 2 MONTH) THEN ttd.quantity ELSE 0 END) AS sales_m3,
                
                0 AS lain_m0, 0 AS lain_m1, 0 AS lain_m2, 0 AS lain_m3
                
            FROM ttd_sales ttd
            JOIN ttm_sales ttm ON ttm.sales_id = ttd.sales_id
            JOIN tt_salinv ts ON ts.sales_id = ttm.sales_id
            WHERE ts.dinvoice >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 3 MONTH)
            GROUP BY ttd.inv_type, ttm.branch_id

            UNION ALL

            SELECT 
                d.inv_type,
                m.branch_id,
                d.hpp AS hpp_ref,
                0, 0, 0, 0,
                
                SUM(CASE WHEN m.dkeluar >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') AND m.dkeluar < DATE_ADD(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) THEN d.qty ELSE 0 END) AS lain_m0,
                SUM(CASE WHEN m.dkeluar >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) AND m.dkeluar < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN d.qty ELSE 0 END) AS lain_m1,
                SUM(CASE WHEN m.dkeluar >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 2 MONTH) AND m.dkeluar < DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) THEN d.qty ELSE 0 END) AS lain_m2,
                SUM(CASE WHEN m.dkeluar >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 3 MONTH) AND m.dkeluar < DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 2 MONTH) THEN d.qty ELSE 0 END) AS lain_m3
                
            FROM ttd_pengeluaran_lain d
            JOIN ttm_pengeluaran_lain m ON d.keluar_id = m.keluar_id
            WHERE m.dkeluar >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 3 MONTH)
            GROUP BY d.inv_type, m.branch_id, d.hpp
        ) t
        LEFT JOIN (
            -- SUBQUERY: CURRENT STOCK
            SELECT 
                s.inv_type,
                w.branch_id,
                SUM(s.tot_qty) AS current_qty
            FROM ttm_stock s
            JOIN tr_whouse w ON s.whouse_id = w.whouse_id
            WHERE (w.whouse_id LIKE '%001' OR w.whouse_id LIKE '%003')
            GROUP BY s.inv_type, w.branch_id
        ) stk ON t.inv_type = stk.inv_type AND t.branch_id = stk.branch_id
        LEFT JOIN (
            -- SUBQUERY: BRANCH CONFIG
            SELECT branch_id, COALESCE(buf_stock, 0) AS buffer_bulan
            FROM mz_mybranch
        ) bc ON t.branch_id = bc.branch_id
        GROUP BY t.inv_type, t.branch_id
    ) cv
) fm
LEFT JOIN tr_inv_type ti ON ti.inv_type = fm.inv_type
GROUP BY fm.inv_type, ti.name, fm.hpp_ref
ORDER BY Total_Sales_M0 DESC;