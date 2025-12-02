SELECT 
    fd.inv_type AS kode_item,
    ti.name AS nama_item,
    (SELECT MAX(hpp) FROM ttd_pengeluaran_lain WHERE inv_type = fd.inv_type LIMIT 1) as hpp_ref,

    -- === TOTAL NASIONAL ===
    SUM(fd.current_qty)       AS Nas_Total_Stock,
    SUM(fd.replenishment_qty) AS Nas_Total_Replenish,
    -- DOI NASIONAL
    CASE 
        WHEN (SUM(fd.s_m1)+SUM(fd.s_m2)+SUM(fd.s_m3) + SUM(fd.l_m1)+SUM(fd.l_m2)+SUM(fd.l_m3)) > 0 
        THEN ROUND( SUM(fd.current_qty) / ( (SUM(fd.s_m1)+SUM(fd.s_m2)+SUM(fd.s_m3) + SUM(fd.l_m1)+SUM(fd.l_m2)+SUM(fd.l_m3)) / 3 ) , 1)
        ELSE 999 
    END AS Nas_Total_DOI,

    SUM(fd.s_m0) AS Nas_Sales_M0, SUM(fd.s_m1) AS Nas_Sales_M1, SUM(fd.s_m2) AS Nas_Sales_M2, SUM(fd.s_m3) AS Nas_Sales_M3,
    SUM(fd.l_m0) AS Nas_Lain_M0,  SUM(fd.l_m1) AS Nas_Lain_M1,  SUM(fd.l_m2) AS Nas_Lain_M2,  SUM(fd.l_m3) AS Nas_Lain_M3,

    -- =========================================================================
    -- 34 BRANCH PIVOT (FULL LIST)
    -- =========================================================================
gu
    -- 1. JKT
    SUM(CASE WHEN fd.branch_id='JKT' THEN fd.current_qty ELSE 0 END) AS JKT_Stock,
    SUM(CASE WHEN fd.branch_id='JKT' THEN fd.replenishment_qty ELSE 0 END) AS JKT_Replenish,
    SUM(CASE WHEN fd.branch_id='JKT' THEN fd.doi_val ELSE 0 END) AS JKT_DOI,
    SUM(CASE WHEN fd.branch_id='JKT' THEN fd.s_m0 ELSE 0 END) AS JKT_S_M0, SUM(CASE WHEN fd.branch_id='JKT' THEN fd.s_m1 ELSE 0 END) AS JKT_S_M1, SUM(CASE WHEN fd.branch_id='JKT' THEN fd.s_m2 ELSE 0 END) AS JKT_S_M2, SUM(CASE WHEN fd.branch_id='JKT' THEN fd.s_m3 ELSE 0 END) AS JKT_S_M3,
    SUM(CASE WHEN fd.branch_id='JKT' THEN fd.l_m0 ELSE 0 END) AS JKT_L_M0, SUM(CASE WHEN fd.branch_id='JKT' THEN fd.l_m1 ELSE 0 END) AS JKT_L_M1, SUM(CASE WHEN fd.branch_id='JKT' THEN fd.l_m2 ELSE 0 END) AS JKT_L_M2, SUM(CASE WHEN fd.branch_id='JKT' THEN fd.l_m3 ELSE 0 END) AS JKT_L_M3,

    -- 2. SBY
    SUM(CASE WHEN fd.branch_id='SBY' THEN fd.current_qty ELSE 0 END) AS SBY_Stock,
    SUM(CASE WHEN fd.branch_id='SBY' THEN fd.replenishment_qty ELSE 0 END) AS SBY_Replenish,
    SUM(CASE WHEN fd.branch_id='SBY' THEN fd.doi_val ELSE 0 END) AS SBY_DOI,
    SUM(CASE WHEN fd.branch_id='SBY' THEN fd.s_m0 ELSE 0 END) AS SBY_S_M0, SUM(CASE WHEN fd.branch_id='SBY' THEN fd.s_m1 ELSE 0 END) AS SBY_S_M1, SUM(CASE WHEN fd.branch_id='SBY' THEN fd.s_m2 ELSE 0 END) AS SBY_S_M2, SUM(CASE WHEN fd.branch_id='SBY' THEN fd.s_m3 ELSE 0 END) AS SBY_S_M3,
    SUM(CASE WHEN fd.branch_id='SBY' THEN fd.l_m0 ELSE 0 END) AS SBY_L_M0, SUM(CASE WHEN fd.branch_id='SBY' THEN fd.l_m1 ELSE 0 END) AS SBY_L_M1, SUM(CASE WHEN fd.branch_id='SBY' THEN fd.l_m2 ELSE 0 END) AS SBY_L_M2, SUM(CASE WHEN fd.branch_id='SBY' THEN fd.l_m3 ELSE 0 END) AS SBY_L_M3,

    -- 3. SMG
    SUM(CASE WHEN fd.branch_id='SMG' THEN fd.current_qty ELSE 0 END) AS SMG_Stock,
    SUM(CASE WHEN fd.branch_id='SMG' THEN fd.replenishment_qty ELSE 0 END) AS SMG_Replenish,
    SUM(CASE WHEN fd.branch_id='SMG' THEN fd.doi_val ELSE 0 END) AS SMG_DOI,
    SUM(CASE WHEN fd.branch_id='SMG' THEN fd.s_m0 ELSE 0 END) AS SMG_S_M0, SUM(CASE WHEN fd.branch_id='SMG' THEN fd.s_m1 ELSE 0 END) AS SMG_S_M1, SUM(CASE WHEN fd.branch_id='SMG' THEN fd.s_m2 ELSE 0 END) AS SMG_S_M2, SUM(CASE WHEN fd.branch_id='SMG' THEN fd.s_m3 ELSE 0 END) AS SMG_S_M3,
    SUM(CASE WHEN fd.branch_id='SMG' THEN fd.l_m0 ELSE 0 END) AS SMG_L_M0, SUM(CASE WHEN fd.branch_id='SMG' THEN fd.l_m1 ELSE 0 END) AS SMG_L_M1, SUM(CASE WHEN fd.branch_id='SMG' THEN fd.l_m2 ELSE 0 END) AS SMG_L_M2, SUM(CASE WHEN fd.branch_id='SMG' THEN fd.l_m3 ELSE 0 END) AS SMG_L_M3,

    -- 4. MDN
    SUM(CASE WHEN fd.branch_id='MDN' THEN fd.current_qty ELSE 0 END) AS MDN_Stock,
    SUM(CASE WHEN fd.branch_id='MDN' THEN fd.replenishment_qty ELSE 0 END) AS MDN_Replenish,
    SUM(CASE WHEN fd.branch_id='MDN' THEN fd.doi_val ELSE 0 END) AS MDN_DOI,
    SUM(CASE WHEN fd.branch_id='MDN' THEN fd.s_m0 ELSE 0 END) AS MDN_S_M0, SUM(CASE WHEN fd.branch_id='MDN' THEN fd.s_m1 ELSE 0 END) AS MDN_S_M1, SUM(CASE WHEN fd.branch_id='MDN' THEN fd.s_m2 ELSE 0 END) AS MDN_S_M2, SUM(CASE WHEN fd.branch_id='MDN' THEN fd.s_m3 ELSE 0 END) AS MDN_S_M3,
    SUM(CASE WHEN fd.branch_id='MDN' THEN fd.l_m0 ELSE 0 END) AS MDN_L_M0, SUM(CASE WHEN fd.branch_id='MDN' THEN fd.l_m1 ELSE 0 END) AS MDN_L_M1, SUM(CASE WHEN fd.branch_id='MDN' THEN fd.l_m2 ELSE 0 END) AS MDN_L_M2, SUM(CASE WHEN fd.branch_id='MDN' THEN fd.l_m3 ELSE 0 END) AS MDN_L_M3,

    -- 5. HO
    SUM(CASE WHEN fd.branch_id='HO' THEN fd.current_qty ELSE 0 END) AS HO_Stock,
    SUM(CASE WHEN fd.branch_id='HO' THEN fd.replenishment_qty ELSE 0 END) AS HO_Replenish,
    SUM(CASE WHEN fd.branch_id='HO' THEN fd.doi_val ELSE 0 END) AS HO_DOI,
    SUM(CASE WHEN fd.branch_id='HO' THEN fd.s_m0 ELSE 0 END) AS HO_S_M0, SUM(CASE WHEN fd.branch_id='HO' THEN fd.s_m1 ELSE 0 END) AS HO_S_M1, SUM(CASE WHEN fd.branch_id='HO' THEN fd.s_m2 ELSE 0 END) AS HO_S_M2, SUM(CASE WHEN fd.branch_id='HO' THEN fd.s_m3 ELSE 0 END) AS HO_S_M3,
    SUM(CASE WHEN fd.branch_id='HO' THEN fd.l_m0 ELSE 0 END) AS HO_L_M0, SUM(CASE WHEN fd.branch_id='HO' THEN fd.l_m1 ELSE 0 END) AS HO_L_M1, SUM(CASE WHEN fd.branch_id='HO' THEN fd.l_m2 ELSE 0 END) AS HO_L_M2, SUM(CASE WHEN fd.branch_id='HO' THEN fd.l_m3 ELSE 0 END) AS HO_L_M3,

    -- 6. MKS
    SUM(CASE WHEN fd.branch_id='MKS' THEN fd.current_qty ELSE 0 END) AS MKS_Stock,
    SUM(CASE WHEN fd.branch_id='MKS' THEN fd.replenishment_qty ELSE 0 END) AS MKS_Replenish,
    SUM(CASE WHEN fd.branch_id='MKS' THEN fd.doi_val ELSE 0 END) AS MKS_DOI,
    SUM(CASE WHEN fd.branch_id='MKS' THEN fd.s_m0 ELSE 0 END) AS MKS_S_M0, SUM(CASE WHEN fd.branch_id='MKS' THEN fd.s_m1 ELSE 0 END) AS MKS_S_M1, SUM(CASE WHEN fd.branch_id='MKS' THEN fd.s_m2 ELSE 0 END) AS MKS_S_M2, SUM(CASE WHEN fd.branch_id='MKS' THEN fd.s_m3 ELSE 0 END) AS MKS_S_M3,
    SUM(CASE WHEN fd.branch_id='MKS' THEN fd.l_m0 ELSE 0 END) AS MKS_L_M0, SUM(CASE WHEN fd.branch_id='MKS' THEN fd.l_m1 ELSE 0 END) AS MKS_L_M1, SUM(CASE WHEN fd.branch_id='MKS' THEN fd.l_m2 ELSE 0 END) AS MKS_L_M2, SUM(CASE WHEN fd.branch_id='MKS' THEN fd.l_m3 ELSE 0 END) AS MKS_L_M3,

    -- 7. BJM
    SUM(CASE WHEN fd.branch_id='BJM' THEN fd.current_qty ELSE 0 END) AS BJM_Stock,
    SUM(CASE WHEN fd.branch_id='BJM' THEN fd.replenishment_qty ELSE 0 END) AS BJM_Replenish,
    SUM(CASE WHEN fd.branch_id='BJM' THEN fd.doi_val ELSE 0 END) AS BJM_DOI,
    SUM(CASE WHEN fd.branch_id='BJM' THEN fd.s_m0 ELSE 0 END) AS BJM_S_M0, SUM(CASE WHEN fd.branch_id='BJM' THEN fd.s_m1 ELSE 0 END) AS BJM_S_M1, SUM(CASE WHEN fd.branch_id='BJM' THEN fd.s_m2 ELSE 0 END) AS BJM_S_M2, SUM(CASE WHEN fd.branch_id='BJM' THEN fd.s_m3 ELSE 0 END) AS BJM_S_M3,
    SUM(CASE WHEN fd.branch_id='BJM' THEN fd.l_m0 ELSE 0 END) AS BJM_L_M0, SUM(CASE WHEN fd.branch_id='BJM' THEN fd.l_m1 ELSE 0 END) AS BJM_L_M1, SUM(CASE WHEN fd.branch_id='BJM' THEN fd.l_m2 ELSE 0 END) AS BJM_L_M2, SUM(CASE WHEN fd.branch_id='BJM' THEN fd.l_m3 ELSE 0 END) AS BJM_L_M3,

    -- 8. PKU
    SUM(CASE WHEN fd.branch_id='PKU' THEN fd.current_qty ELSE 0 END) AS PKU_Stock,
    SUM(CASE WHEN fd.branch_id='PKU' THEN fd.replenishment_qty ELSE 0 END) AS PKU_Replenish,
    SUM(CASE WHEN fd.branch_id='PKU' THEN fd.doi_val ELSE 0 END) AS PKU_DOI,
    SUM(CASE WHEN fd.branch_id='PKU' THEN fd.s_m0 ELSE 0 END) AS PKU_S_M0, SUM(CASE WHEN fd.branch_id='PKU' THEN fd.s_m1 ELSE 0 END) AS PKU_S_M1, SUM(CASE WHEN fd.branch_id='PKU' THEN fd.s_m2 ELSE 0 END) AS PKU_S_M2, SUM(CASE WHEN fd.branch_id='PKU' THEN fd.s_m3 ELSE 0 END) AS PKU_S_M3,
    SUM(CASE WHEN fd.branch_id='PKU' THEN fd.l_m0 ELSE 0 END) AS PKU_L_M0, SUM(CASE WHEN fd.branch_id='PKU' THEN fd.l_m1 ELSE 0 END) AS PKU_L_M1, SUM(CASE WHEN fd.branch_id='PKU' THEN fd.l_m2 ELSE 0 END) AS PKU_L_M2, SUM(CASE WHEN fd.branch_id='PKU' THEN fd.l_m3 ELSE 0 END) AS PKU_L_M3,

    -- 9. DPS
    SUM(CASE WHEN fd.branch_id='DPS' THEN fd.current_qty ELSE 0 END) AS DPS_Stock,
    SUM(CASE WHEN fd.branch_id='DPS' THEN fd.replenishment_qty ELSE 0 END) AS DPS_Replenish,
    SUM(CASE WHEN fd.branch_id='DPS' THEN fd.doi_val ELSE 0 END) AS DPS_DOI,
    SUM(CASE WHEN fd.branch_id='DPS' THEN fd.s_m0 ELSE 0 END) AS DPS_S_M0, SUM(CASE WHEN fd.branch_id='DPS' THEN fd.s_m1 ELSE 0 END) AS DPS_S_M1, SUM(CASE WHEN fd.branch_id='DPS' THEN fd.s_m2 ELSE 0 END) AS DPS_S_M2, SUM(CASE WHEN fd.branch_id='DPS' THEN fd.s_m3 ELSE 0 END) AS DPS_S_M3,
    SUM(CASE WHEN fd.branch_id='DPS' THEN fd.l_m0 ELSE 0 END) AS DPS_L_M0, SUM(CASE WHEN fd.branch_id='DPS' THEN fd.l_m1 ELSE 0 END) AS DPS_L_M1, SUM(CASE WHEN fd.branch_id='DPS' THEN fd.l_m2 ELSE 0 END) AS DPS_L_M2, SUM(CASE WHEN fd.branch_id='DPS' THEN fd.l_m3 ELSE 0 END) AS DPS_L_M3,

    -- 10. PLG
    SUM(CASE WHEN fd.branch_id='PLG' THEN fd.current_qty ELSE 0 END) AS PLG_Stock,
    SUM(CASE WHEN fd.branch_id='PLG' THEN fd.replenishment_qty ELSE 0 END) AS PLG_Replenish,
    SUM(CASE WHEN fd.branch_id='PLG' THEN fd.doi_val ELSE 0 END) AS PLG_DOI,
    SUM(CASE WHEN fd.branch_id='PLG' THEN fd.s_m0 ELSE 0 END) AS PLG_S_M0, SUM(CASE WHEN fd.branch_id='PLG' THEN fd.s_m1 ELSE 0 END) AS PLG_S_M1, SUM(CASE WHEN fd.branch_id='PLG' THEN fd.s_m2 ELSE 0 END) AS PLG_S_M2, SUM(CASE WHEN fd.branch_id='PLG' THEN fd.s_m3 ELSE 0 END) AS PLG_S_M3,
    SUM(CASE WHEN fd.branch_id='PLG' THEN fd.l_m0 ELSE 0 END) AS PLG_L_M0, SUM(CASE WHEN fd.branch_id='PLG' THEN fd.l_m1 ELSE 0 END) AS PLG_L_M1, SUM(CASE WHEN fd.branch_id='PLG' THEN fd.l_m2 ELSE 0 END) AS PLG_L_M2, SUM(CASE WHEN fd.branch_id='PLG' THEN fd.l_m3 ELSE 0 END) AS PLG_L_M3,

    -- 11. YGY
    SUM(CASE WHEN fd.branch_id='YGY' THEN fd.current_qty ELSE 0 END) AS YGY_Stock,
    SUM(CASE WHEN fd.branch_id='YGY' THEN fd.replenishment_qty ELSE 0 END) AS YGY_Replenish,
    SUM(CASE WHEN fd.branch_id='YGY' THEN fd.doi_val ELSE 0 END) AS YGY_DOI,
    SUM(CASE WHEN fd.branch_id='YGY' THEN fd.s_m0 ELSE 0 END) AS YGY_S_M0, SUM(CASE WHEN fd.branch_id='YGY' THEN fd.s_m1 ELSE 0 END) AS YGY_S_M1, SUM(CASE WHEN fd.branch_id='YGY' THEN fd.s_m2 ELSE 0 END) AS YGY_S_M2, SUM(CASE WHEN fd.branch_id='YGY' THEN fd.s_m3 ELSE 0 END) AS YGY_S_M3,
    SUM(CASE WHEN fd.branch_id='YGY' THEN fd.l_m0 ELSE 0 END) AS YGY_L_M0, SUM(CASE WHEN fd.branch_id='YGY' THEN fd.l_m1 ELSE 0 END) AS YGY_L_M1, SUM(CASE WHEN fd.branch_id='YGY' THEN fd.l_m2 ELSE 0 END) AS YGY_L_M2, SUM(CASE WHEN fd.branch_id='YGY' THEN fd.l_m3 ELSE 0 END) AS YGY_L_M3,

    -- 12. MND
    SUM(CASE WHEN fd.branch_id='MND' THEN fd.current_qty ELSE 0 END) AS MND_Stock,
    SUM(CASE WHEN fd.branch_id='MND' THEN fd.replenishment_qty ELSE 0 END) AS MND_Replenish,
    SUM(CASE WHEN fd.branch_id='MND' THEN fd.doi_val ELSE 0 END) AS MND_DOI,
    SUM(CASE WHEN fd.branch_id='MND' THEN fd.s_m0 ELSE 0 END) AS MND_S_M0, SUM(CASE WHEN fd.branch_id='MND' THEN fd.s_m1 ELSE 0 END) AS MND_S_M1, SUM(CASE WHEN fd.branch_id='MND' THEN fd.s_m2 ELSE 0 END) AS MND_S_M2, SUM(CASE WHEN fd.branch_id='MND' THEN fd.s_m3 ELSE 0 END) AS MND_S_M3,
    SUM(CASE WHEN fd.branch_id='MND' THEN fd.l_m0 ELSE 0 END) AS MND_L_M0, SUM(CASE WHEN fd.branch_id='MND' THEN fd.l_m1 ELSE 0 END) AS MND_L_M1, SUM(CASE WHEN fd.branch_id='MND' THEN fd.l_m2 ELSE 0 END) AS MND_L_M2, SUM(CASE WHEN fd.branch_id='MND' THEN fd.l_m3 ELSE 0 END) AS MND_L_M3,

    -- 13. KPG
    SUM(CASE WHEN fd.branch_id='KPG' THEN fd.current_qty ELSE 0 END) AS KPG_Stock,
    SUM(CASE WHEN fd.branch_id='KPG' THEN fd.replenishment_qty ELSE 0 END) AS KPG_Replenish,
    SUM(CASE WHEN fd.branch_id='KPG' THEN fd.doi_val ELSE 0 END) AS KPG_DOI,
    SUM(CASE WHEN fd.branch_id='KPG' THEN fd.s_m0 ELSE 0 END) AS KPG_S_M0, SUM(CASE WHEN fd.branch_id='KPG' THEN fd.s_m1 ELSE 0 END) AS KPG_S_M1, SUM(CASE WHEN fd.branch_id='KPG' THEN fd.s_m2 ELSE 0 END) AS KPG_S_M2, SUM(CASE WHEN fd.branch_id='KPG' THEN fd.s_m3 ELSE 0 END) AS KPG_S_M3,
    SUM(CASE WHEN fd.branch_id='KPG' THEN fd.l_m0 ELSE 0 END) AS KPG_L_M0, SUM(CASE WHEN fd.branch_id='KPG' THEN fd.l_m1 ELSE 0 END) AS KPG_L_M1, SUM(CASE WHEN fd.branch_id='KPG' THEN fd.l_m2 ELSE 0 END) AS KPG_L_M2, SUM(CASE WHEN fd.branch_id='KPG' THEN fd.l_m3 ELSE 0 END) AS KPG_L_M3,

    -- 14. PDG
    SUM(CASE WHEN fd.branch_id='PDG' THEN fd.current_qty ELSE 0 END) AS PDG_Stock,
    SUM(CASE WHEN fd.branch_id='PDG' THEN fd.replenishment_qty ELSE 0 END) AS PDG_Replenish,
    SUM(CASE WHEN fd.branch_id='PDG' THEN fd.doi_val ELSE 0 END) AS PDG_DOI,
    SUM(CASE WHEN fd.branch_id='PDG' THEN fd.s_m0 ELSE 0 END) AS PDG_S_M0, SUM(CASE WHEN fd.branch_id='PDG' THEN fd.s_m1 ELSE 0 END) AS PDG_S_M1, SUM(CASE WHEN fd.branch_id='PDG' THEN fd.s_m2 ELSE 0 END) AS PDG_S_M2, SUM(CASE WHEN fd.branch_id='PDG' THEN fd.s_m3 ELSE 0 END) AS PDG_S_M3,
    SUM(CASE WHEN fd.branch_id='PDG' THEN fd.l_m0 ELSE 0 END) AS PDG_L_M0, SUM(CASE WHEN fd.branch_id='PDG' THEN fd.l_m1 ELSE 0 END) AS PDG_L_M1, SUM(CASE WHEN fd.branch_id='PDG' THEN fd.l_m2 ELSE 0 END) AS PDG_L_M2, SUM(CASE WHEN fd.branch_id='PDG' THEN fd.l_m3 ELSE 0 END) AS PDG_L_M3,

    -- 15. PDG1
    SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.current_qty ELSE 0 END) AS PDG1_Stock,
    SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.replenishment_qty ELSE 0 END) AS PDG1_Replenish,
    SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.doi_val ELSE 0 END) AS PDG1_DOI,
    SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.s_m0 ELSE 0 END) AS PDG1_S_M0, SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.s_m1 ELSE 0 END) AS PDG1_S_M1, SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.s_m2 ELSE 0 END) AS PDG1_S_M2, SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.s_m3 ELSE 0 END) AS PDG1_S_M3,
    SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.l_m0 ELSE 0 END) AS PDG1_L_M0, SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.l_m1 ELSE 0 END) AS PDG1_L_M1, SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.l_m2 ELSE 0 END) AS PDG1_L_M2, SUM(CASE WHEN fd.branch_id='PDG1' THEN fd.l_m3 ELSE 0 END) AS PDG1_L_M3,

    -- 16. SMR1
    SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.current_qty ELSE 0 END) AS SMR1_Stock,
    SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.replenishment_qty ELSE 0 END) AS SMR1_Replenish,
    SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.doi_val ELSE 0 END) AS SMR1_DOI,
    SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.s_m0 ELSE 0 END) AS SMR1_S_M0, SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.s_m1 ELSE 0 END) AS SMR1_S_M1, SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.s_m2 ELSE 0 END) AS SMR1_S_M2, SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.s_m3 ELSE 0 END) AS SMR1_S_M3,
    SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.l_m0 ELSE 0 END) AS SMR1_L_M0, SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.l_m1 ELSE 0 END) AS SMR1_L_M1, SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.l_m2 ELSE 0 END) AS SMR1_L_M2, SUM(CASE WHEN fd.branch_id='SMR1' THEN fd.l_m3 ELSE 0 END) AS SMR1_L_M3,

    -- 17. DP1
    SUM(CASE WHEN fd.branch_id='DP1' THEN fd.current_qty ELSE 0 END) AS DP1_Stock,
    SUM(CASE WHEN fd.branch_id='DP1' THEN fd.replenishment_qty ELSE 0 END) AS DP1_Replenish,
    SUM(CASE WHEN fd.branch_id='DP1' THEN fd.doi_val ELSE 0 END) AS DP1_DOI,
    SUM(CASE WHEN fd.branch_id='DP1' THEN fd.s_m0 ELSE 0 END) AS DP1_S_M0, SUM(CASE WHEN fd.branch_id='DP1' THEN fd.s_m1 ELSE 0 END) AS DP1_S_M1, SUM(CASE WHEN fd.branch_id='DP1' THEN fd.s_m2 ELSE 0 END) AS DP1_S_M2, SUM(CASE WHEN fd.branch_id='DP1' THEN fd.s_m3 ELSE 0 END) AS DP1_S_M3,
    SUM(CASE WHEN fd.branch_id='DP1' THEN fd.l_m0 ELSE 0 END) AS DP1_L_M0, SUM(CASE WHEN fd.branch_id='DP1' THEN fd.l_m1 ELSE 0 END) AS DP1_L_M1, SUM(CASE WHEN fd.branch_id='DP1' THEN fd.l_m2 ELSE 0 END) AS DP1_L_M2, SUM(CASE WHEN fd.branch_id='DP1' THEN fd.l_m3 ELSE 0 END) AS DP1_L_M3,

    -- 18. MDN1
    SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.current_qty ELSE 0 END) AS MDN1_Stock,
    SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.replenishment_qty ELSE 0 END) AS MDN1_Replenish,
    SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.doi_val ELSE 0 END) AS MDN1_DOI,
    SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.s_m0 ELSE 0 END) AS MDN1_S_M0, SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.s_m1 ELSE 0 END) AS MDN1_S_M1, SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.s_m2 ELSE 0 END) AS MDN1_S_M2, SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.s_m3 ELSE 0 END) AS MDN1_S_M3,
    SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.l_m0 ELSE 0 END) AS MDN1_L_M0, SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.l_m1 ELSE 0 END) AS MDN1_L_M1, SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.l_m2 ELSE 0 END) AS MDN1_L_M2, SUM(CASE WHEN fd.branch_id='MDN1' THEN fd.l_m3 ELSE 0 END) AS MDN1_L_M3,

    -- 19. AMB
    SUM(CASE WHEN fd.branch_id='AMB' THEN fd.current_qty ELSE 0 END) AS AMB_Stock,
    SUM(CASE WHEN fd.branch_id='AMB' THEN fd.replenishment_qty ELSE 0 END) AS AMB_Replenish,
    SUM(CASE WHEN fd.branch_id='AMB' THEN fd.doi_val ELSE 0 END) AS AMB_DOI,
    SUM(CASE WHEN fd.branch_id='AMB' THEN fd.s_m0 ELSE 0 END) AS AMB_S_M0, SUM(CASE WHEN fd.branch_id='AMB' THEN fd.s_m1 ELSE 0 END) AS AMB_S_M1, SUM(CASE WHEN fd.branch_id='AMB' THEN fd.s_m2 ELSE 0 END) AS AMB_S_M2, SUM(CASE WHEN fd.branch_id='AMB' THEN fd.s_m3 ELSE 0 END) AS AMB_S_M3,
    SUM(CASE WHEN fd.branch_id='AMB' THEN fd.l_m0 ELSE 0 END) AS AMB_L_M0, SUM(CASE WHEN fd.branch_id='AMB' THEN fd.l_m1 ELSE 0 END) AS AMB_L_M1, SUM(CASE WHEN fd.branch_id='AMB' THEN fd.l_m2 ELSE 0 END) AS AMB_L_M2, SUM(CASE WHEN fd.branch_id='AMB' THEN fd.l_m3 ELSE 0 END) AS AMB_L_M3,

    -- 20. HO2
    SUM(CASE WHEN fd.branch_id='HO2' THEN fd.current_qty ELSE 0 END) AS HO2_Stock,
    SUM(CASE WHEN fd.branch_id='HO2' THEN fd.replenishment_qty ELSE 0 END) AS HO2_Replenish,
    SUM(CASE WHEN fd.branch_id='HO2' THEN fd.doi_val ELSE 0 END) AS HO2_DOI,
    SUM(CASE WHEN fd.branch_id='HO2' THEN fd.s_m0 ELSE 0 END) AS HO2_S_M0, SUM(CASE WHEN fd.branch_id='HO2' THEN fd.s_m1 ELSE 0 END) AS HO2_S_M1, SUM(CASE WHEN fd.branch_id='HO2' THEN fd.s_m2 ELSE 0 END) AS HO2_S_M2, SUM(CASE WHEN fd.branch_id='HO2' THEN fd.s_m3 ELSE 0 END) AS HO2_S_M3,
    SUM(CASE WHEN fd.branch_id='HO2' THEN fd.l_m0 ELSE 0 END) AS HO2_L_M0, SUM(CASE WHEN fd.branch_id='HO2' THEN fd.l_m1 ELSE 0 END) AS HO2_L_M1, SUM(CASE WHEN fd.branch_id='HO2' THEN fd.l_m2 ELSE 0 END) AS HO2_L_M2, SUM(CASE WHEN fd.branch_id='HO2' THEN fd.l_m3 ELSE 0 END) AS HO2_L_M3,

    -- 21. PKU1
    SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.current_qty ELSE 0 END) AS PKU1_Stock,
    SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.replenishment_qty ELSE 0 END) AS PKU1_Replenish,
    SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.doi_val ELSE 0 END) AS PKU1_DOI,
    SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.s_m0 ELSE 0 END) AS PKU1_S_M0, SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.s_m1 ELSE 0 END) AS PKU1_S_M1, SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.s_m2 ELSE 0 END) AS PKU1_S_M2, SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.s_m3 ELSE 0 END) AS PKU1_S_M3,
    SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.l_m0 ELSE 0 END) AS PKU1_L_M0, SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.l_m1 ELSE 0 END) AS PKU1_L_M1, SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.l_m2 ELSE 0 END) AS PKU1_L_M2, SUM(CASE WHEN fd.branch_id='PKU1' THEN fd.l_m3 ELSE 0 END) AS PKU1_L_M3,

    -- 22. JMB1
    SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.current_qty ELSE 0 END) AS JMB1_Stock,
    SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.replenishment_qty ELSE 0 END) AS JMB1_Replenish,
    SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.doi_val ELSE 0 END) AS JMB1_DOI,
    SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.s_m0 ELSE 0 END) AS JMB1_S_M0, SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.s_m1 ELSE 0 END) AS JMB1_S_M1, SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.s_m2 ELSE 0 END) AS JMB1_S_M2, SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.s_m3 ELSE 0 END) AS JMB1_S_M3,
    SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.l_m0 ELSE 0 END) AS JMB1_L_M0, SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.l_m1 ELSE 0 END) AS JMB1_L_M1, SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.l_m2 ELSE 0 END) AS JMB1_L_M2, SUM(CASE WHEN fd.branch_id='JMB1' THEN fd.l_m3 ELSE 0 END) AS JMB1_L_M3,

    -- 23. BKP
    SUM(CASE WHEN fd.branch_id='BKP' THEN fd.current_qty ELSE 0 END) AS BKP_Stock,
    SUM(CASE WHEN fd.branch_id='BKP' THEN fd.replenishment_qty ELSE 0 END) AS BKP_Replenish,
    SUM(CASE WHEN fd.branch_id='BKP' THEN fd.doi_val ELSE 0 END) AS BKP_DOI,
    SUM(CASE WHEN fd.branch_id='BKP' THEN fd.s_m0 ELSE 0 END) AS BKP_S_M0, SUM(CASE WHEN fd.branch_id='BKP' THEN fd.s_m1 ELSE 0 END) AS BKP_S_M1, SUM(CASE WHEN fd.branch_id='BKP' THEN fd.s_m2 ELSE 0 END) AS BKP_S_M2, SUM(CASE WHEN fd.branch_id='BKP' THEN fd.s_m3 ELSE 0 END) AS BKP_S_M3,
    SUM(CASE WHEN fd.branch_id='BKP' THEN fd.l_m0 ELSE 0 END) AS BKP_L_M0, SUM(CASE WHEN fd.branch_id='BKP' THEN fd.l_m1 ELSE 0 END) AS BKP_L_M1, SUM(CASE WHEN fd.branch_id='BKP' THEN fd.l_m2 ELSE 0 END) AS BKP_L_M2, SUM(CASE WHEN fd.branch_id='BKP' THEN fd.l_m3 ELSE 0 END) AS BKP_L_M3,

    -- 24. PLU1
    SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.current_qty ELSE 0 END) AS PLU1_Stock,
    SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.replenishment_qty ELSE 0 END) AS PLU1_Replenish,
    SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.doi_val ELSE 0 END) AS PLU1_DOI,
    SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.s_m0 ELSE 0 END) AS PLU1_S_M0, SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.s_m1 ELSE 0 END) AS PLU1_S_M1, SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.s_m2 ELSE 0 END) AS PLU1_S_M2, SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.s_m3 ELSE 0 END) AS PLU1_S_M3,
    SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.l_m0 ELSE 0 END) AS PLU1_L_M0, SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.l_m1 ELSE 0 END) AS PLU1_L_M1, SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.l_m2 ELSE 0 END) AS PLU1_L_M2, SUM(CASE WHEN fd.branch_id='PLU1' THEN fd.l_m3 ELSE 0 END) AS PLU1_L_M3,

    -- 25. AMB1
    SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.current_qty ELSE 0 END) AS AMB1_Stock,
    SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.replenishment_qty ELSE 0 END) AS AMB1_Replenish,
    SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.doi_val ELSE 0 END) AS AMB1_DOI,
    SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.s_m0 ELSE 0 END) AS AMB1_S_M0, SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.s_m1 ELSE 0 END) AS AMB1_S_M1, SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.s_m2 ELSE 0 END) AS AMB1_S_M2, SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.s_m3 ELSE 0 END) AS AMB1_S_M3,
    SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.l_m0 ELSE 0 END) AS AMB1_L_M0, SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.l_m1 ELSE 0 END) AS AMB1_L_M1, SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.l_m2 ELSE 0 END) AS AMB1_L_M2, SUM(CASE WHEN fd.branch_id='AMB1' THEN fd.l_m3 ELSE 0 END) AS AMB1_L_M3,

    -- 26. PLG1
    SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.current_qty ELSE 0 END) AS PLG1_Stock,
    SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.replenishment_qty ELSE 0 END) AS PLG1_Replenish,
    SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.doi_val ELSE 0 END) AS PLG1_DOI,
    SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.s_m0 ELSE 0 END) AS PLG1_S_M0, SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.s_m1 ELSE 0 END) AS PLG1_S_M1, SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.s_m2 ELSE 0 END) AS PLG1_S_M2, SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.s_m3 ELSE 0 END) AS PLG1_S_M3,
    SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.l_m0 ELSE 0 END) AS PLG1_L_M0, SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.l_m1 ELSE 0 END) AS PLG1_L_M1, SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.l_m2 ELSE 0 END) AS PLG1_L_M2, SUM(CASE WHEN fd.branch_id='PLG1' THEN fd.l_m3 ELSE 0 END) AS PLG1_L_M3,

    -- 27. MKS1
    SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.current_qty ELSE 0 END) AS MKS1_Stock,
    SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.replenishment_qty ELSE 0 END) AS MKS1_Replenish,
    SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.doi_val ELSE 0 END) AS MKS1_DOI,
    SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.s_m0 ELSE 0 END) AS MKS1_S_M0, SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.s_m1 ELSE 0 END) AS MKS1_S_M1, SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.s_m2 ELSE 0 END) AS MKS1_S_M2, SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.s_m3 ELSE 0 END) AS MKS1_S_M3,
    SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.l_m0 ELSE 0 END) AS MKS1_L_M0, SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.l_m1 ELSE 0 END) AS MKS1_L_M1, SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.l_m2 ELSE 0 END) AS MKS1_L_M2, SUM(CASE WHEN fd.branch_id='MKS1' THEN fd.l_m3 ELSE 0 END) AS MKS1_L_M3,

    -- 28. BJM1
    SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.current_qty ELSE 0 END) AS BJM1_Stock,
    SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.replenishment_qty ELSE 0 END) AS BJM1_Replenish,
    SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.doi_val ELSE 0 END) AS BJM1_DOI,
    SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.s_m0 ELSE 0 END) AS BJM1_S_M0, SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.s_m1 ELSE 0 END) AS BJM1_S_M1, SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.s_m2 ELSE 0 END) AS BJM1_S_M2, SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.s_m3 ELSE 0 END) AS BJM1_S_M3,
    SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.l_m0 ELSE 0 END) AS BJM1_L_M0, SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.l_m1 ELSE 0 END) AS BJM1_L_M1, SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.l_m2 ELSE 0 END) AS BJM1_L_M2, SUM(CASE WHEN fd.branch_id='BJM1' THEN fd.l_m3 ELSE 0 END) AS BJM1_L_M3,

    -- 29. MKP
    SUM(CASE WHEN fd.branch_id='MKP' THEN fd.current_qty ELSE 0 END) AS MKP_Stock,
    SUM(CASE WHEN fd.branch_id='MKP' THEN fd.replenishment_qty ELSE 0 END) AS MKP_Replenish,
    SUM(CASE WHEN fd.branch_id='MKP' THEN fd.doi_val ELSE 0 END) AS MKP_DOI,
    SUM(CASE WHEN fd.branch_id='MKP' THEN fd.s_m0 ELSE 0 END) AS MKP_S_M0, SUM(CASE WHEN fd.branch_id='MKP' THEN fd.s_m1 ELSE 0 END) AS MKP_S_M1, SUM(CASE WHEN fd.branch_id='MKP' THEN fd.s_m2 ELSE 0 END) AS MKP_S_M2, SUM(CASE WHEN fd.branch_id='MKP' THEN fd.s_m3 ELSE 0 END) AS MKP_S_M3,
    SUM(CASE WHEN fd.branch_id='MKP' THEN fd.l_m0 ELSE 0 END) AS MKP_L_M0, SUM(CASE WHEN fd.branch_id='MKP' THEN fd.l_m1 ELSE 0 END) AS MKP_L_M1, SUM(CASE WHEN fd.branch_id='MKP' THEN fd.l_m2 ELSE 0 END) AS MKP_L_M2, SUM(CASE WHEN fd.branch_id='MKP' THEN fd.l_m3 ELSE 0 END) AS MKP_L_M3,

    -- 30. PHL
    SUM(CASE WHEN fd.branch_id='PHL' THEN fd.current_qty ELSE 0 END) AS PHL_Stock,
    SUM(CASE WHEN fd.branch_id='PHL' THEN fd.replenishment_qty ELSE 0 END) AS PHL_Replenish,
    SUM(CASE WHEN fd.branch_id='PHL' THEN fd.doi_val ELSE 0 END) AS PHL_DOI,
    SUM(CASE WHEN fd.branch_id='PHL' THEN fd.s_m0 ELSE 0 END) AS PHL_S_M0, SUM(CASE WHEN fd.branch_id='PHL' THEN fd.s_m1 ELSE 0 END) AS PHL_S_M1, SUM(CASE WHEN fd.branch_id='PHL' THEN fd.s_m2 ELSE 0 END) AS PHL_S_M2, SUM(CASE WHEN fd.branch_id='PHL' THEN fd.s_m3 ELSE 0 END) AS PHL_S_M3,
    SUM(CASE WHEN fd.branch_id='PHL' THEN fd.l_m0 ELSE 0 END) AS PHL_L_M0, SUM(CASE WHEN fd.branch_id='PHL' THEN fd.l_m1 ELSE 0 END) AS PHL_L_M1, SUM(CASE WHEN fd.branch_id='PHL' THEN fd.l_m2 ELSE 0 END) AS PHL_L_M2, SUM(CASE WHEN fd.branch_id='PHL' THEN fd.l_m3 ELSE 0 END) AS PHL_L_M3,

    -- 31. PTK1
    SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.current_qty ELSE 0 END) AS PTK1_Stock,
    SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.replenishment_qty ELSE 0 END) AS PTK1_Replenish,
    SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.doi_val ELSE 0 END) AS PTK1_DOI,
    SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.s_m0 ELSE 0 END) AS PTK1_S_M0, SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.s_m1 ELSE 0 END) AS PTK1_S_M1, SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.s_m2 ELSE 0 END) AS PTK1_S_M2, SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.s_m3 ELSE 0 END) AS PTK1_S_M3,
    SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.l_m0 ELSE 0 END) AS PTK1_L_M0, SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.l_m1 ELSE 0 END) AS PTK1_L_M1, SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.l_m2 ELSE 0 END) AS PTK1_L_M2, SUM(CASE WHEN fd.branch_id='PTK1' THEN fd.l_m3 ELSE 0 END) AS PTK1_L_M3,

    -- 32. MKPS
    SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.current_qty ELSE 0 END) AS MKPS_Stock,
    SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.replenishment_qty ELSE 0 END) AS MKPS_Replenish,
    SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.doi_val ELSE 0 END) AS MKPS_DOI,
    SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.s_m0 ELSE 0 END) AS MKPS_S_M0, SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.s_m1 ELSE 0 END) AS MKPS_S_M1, SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.s_m2 ELSE 0 END) AS MKPS_S_M2, SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.s_m3 ELSE 0 END) AS MKPS_S_M3,
    SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.l_m0 ELSE 0 END) AS MKPS_L_M0, SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.l_m1 ELSE 0 END) AS MKPS_L_M1, SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.l_m2 ELSE 0 END) AS MKPS_L_M2, SUM(CASE WHEN fd.branch_id='MKPS' THEN fd.l_m3 ELSE 0 END) AS MKPS_L_M3,

    -- 33. MKPM
    SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.current_qty ELSE 0 END) AS MKPM_Stock,
    SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.replenishment_qty ELSE 0 END) AS MKPM_Replenish,
    SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.doi_val ELSE 0 END) AS MKPM_DOI,
    SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.s_m0 ELSE 0 END) AS MKPM_S_M0, SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.s_m1 ELSE 0 END) AS MKPM_S_M1, SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.s_m2 ELSE 0 END) AS MKPM_S_M2, SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.s_m3 ELSE 0 END) AS MKPM_S_M3,
    SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.l_m0 ELSE 0 END) AS MKPM_L_M0, SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.l_m1 ELSE 0 END) AS MKPM_L_M1, SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.l_m2 ELSE 0 END) AS MKPM_L_M2, SUM(CASE WHEN fd.branch_id='MKPM' THEN fd.l_m3 ELSE 0 END) AS MKPM_L_M3,

    -- 34. MKPN
    SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.current_qty ELSE 0 END) AS MKPN_Stock,
    SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.replenishment_qty ELSE 0 END) AS MKPN_Replenish,
    SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.doi_val ELSE 0 END) AS MKPN_DOI,
    SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.s_m0 ELSE 0 END) AS MKPN_S_M0, SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.s_m1 ELSE 0 END) AS MKPN_S_M1, SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.s_m2 ELSE 0 END) AS MKPN_S_M2, SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.s_m3 ELSE 0 END) AS MKPN_S_M3,
    SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.l_m0 ELSE 0 END) AS MKPN_L_M0, SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.l_m1 ELSE 0 END) AS MKPN_L_M1, SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.l_m2 ELSE 0 END) AS MKPN_L_M2, SUM(CASE WHEN fd.branch_id='MKPN' THEN fd.l_m3 ELSE 0 END) AS MKPN_L_M3,

    -- 35. LPG1 (TAMBAHAN DARI DATA STOCK)
    SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.current_qty ELSE 0 END) AS LPG1_Stock,
    SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.replenishment_qty ELSE 0 END) AS LPG1_Replenish,
    SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.doi_val ELSE 0 END) AS LPG1_DOI,
    SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.s_m0 ELSE 0 END) AS LPG1_S_M0, SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.s_m1 ELSE 0 END) AS LPG1_S_M1, SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.s_m2 ELSE 0 END) AS LPG1_S_M2, SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.s_m3 ELSE 0 END) AS LPG1_S_M3,
    SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.l_m0 ELSE 0 END) AS LPG1_L_M0, SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.l_m1 ELSE 0 END) AS LPG1_L_M1, SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.l_m2 ELSE 0 END) AS LPG1_L_M2, SUM(CASE WHEN fd.branch_id='LPG1' THEN fd.l_m3 ELSE 0 END) AS LPG1_L_M3

FROM (
    SELECT 
        ce.*,
        GREATEST(0, CEIL( (ce.avg_flow * ce.buffer_val) - ce.current_qty )) AS replenishment_qty,
        CASE 
            WHEN ce.avg_flow > 0 THEN ROUND(ce.current_qty / ce.avg_flow, 1)
            WHEN ce.current_qty > 0 THEN 999 
            ELSE 0 
        END AS doi_val
    FROM (
        SELECT 
            t.inv_type,
            t.branch_id,
            SUM(sales_m0) as s_m0, SUM(sales_m1) as s_m1, SUM(sales_m2) as s_m2, SUM(sales_m3) as s_m3,
            SUM(lain_m0) as l_m0, SUM(lain_m1) as l_m1, SUM(lain_m2) as l_m2, SUM(lain_m3) as l_m3,
            
            COALESCE(MAX(stk.current_qty), 0) AS current_qty,
            COALESCE(MAX(bc.buffer_bulan), 0) AS buffer_val,
            
            ( (SUM(sales_m1)+SUM(sales_m2)+SUM(sales_m3)) + (SUM(lain_m1)+SUM(lain_m2)+SUM(lain_m3)) ) / 3.0 AS avg_flow
        FROM (
            SELECT 
                ttd.inv_type,
                ttm.branch_id,
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
                0, 0, 0, 0,
                SUM(CASE WHEN m.dkeluar >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') AND m.dkeluar < DATE_ADD(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) THEN d.qty ELSE 0 END) AS lain_m0,
                SUM(CASE WHEN m.dkeluar >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) AND m.dkeluar < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN d.qty ELSE 0 END) AS lain_m1,
                SUM(CASE WHEN m.dkeluar >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 2 MONTH) AND m.dkeluar < DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) THEN d.qty ELSE 0 END) AS lain_m2,
                SUM(CASE WHEN m.dkeluar >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 3 MONTH) AND m.dkeluar < DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 2 MONTH) THEN d.qty ELSE 0 END) AS lain_m3
            FROM ttd_pengeluaran_lain d
            JOIN ttm_pengeluaran_lain m ON d.keluar_id = m.keluar_id
            WHERE m.dkeluar >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 3 MONTH)
            GROUP BY d.inv_type, m.branch_id
        ) t

        LEFT JOIN (
            SELECT 
                s.inv_type,
                w.branch_id,
                SUM(s.tot_qty) AS current_qty
            FROM ttm_stock s
            JOIN tr_whouse w ON s.whouse_id = w.whouse_id
            WHERE (w.name LIKE '%Utama%' OR w.name LIKE '%Karantina%')
              AND w.name NOT LIKE '%Konsinyasi%' 
            GROUP BY s.inv_type, w.branch_id
        ) stk ON t.inv_type = stk.inv_type AND t.branch_id = stk.branch_id

        LEFT JOIN (
            SELECT branch_id, COALESCE(buf_stock, 0) AS buffer_bulan
            FROM mz_mybranch
        ) bc ON t.branch_id = bc.branch_id
        
        GROUP BY t.inv_type, t.branch_id
    ) ce
) fd
LEFT JOIN tr_inv_type ti ON ti.inv_type = fd.inv_type
GROUP BY fd.inv_type, ti.name
ORDER BY Nas_Total_Replenish DESC;