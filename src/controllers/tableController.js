import pool from "../config/db.js";
import { TranslationService, STATUS_COLORS } from "../services/translationService.js";

export const getAllTables = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        table_id,
        capacity,
        is_occupied,
        table_status,
        server_name,
        occupied_duration_minutes,
        order_item_count,
        total_amount,
        customer_name,
        customer_phone
      FROM dashboard_tables 
      ORDER BY 
        CASE WHEN is_occupied THEN 0 ELSE 1 END,
        table_id
    `);

    res.json({
      success: true,
      message: "Tables retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM dashboard_stats');

    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

export const getTableSections = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM table_sections ORDER BY section_code');

    res.json({
      success: true,
      message: "Table sections retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching table sections:', error);
    next(error);
  }
};

export const getSectionSummary = async (req, res, next) => {
  const { lang } = req.query;
  const language = lang || TranslationService.getDefaultLanguage();

  try {
    const result = await pool.query('SELECT * FROM dashboard_section_summary');
    
    const enhancedData = result.rows.map(section => {
      const sectionInfo = TranslationService.getSectionInfo(section.section_code, language);
      const statusText = TranslationService.getStatusText(section.section_status, language);
      const statusColors = STATUS_COLORS[section.section_status] || STATUS_COLORS.quiet;
      
      return {
        ...section,
        section_name_localized: sectionInfo.name,
        section_description: sectionInfo.description,
        status_text: statusText,
        status_color: statusColors.color,
        status_icon: statusColors.icon,
        language: language
      };
    });

    res.json({
      success: true,
      message: "Section summary retrieved successfully",
      data: enhancedData,
      meta: {
        language: language,
        supportedLanguages: TranslationService.getSupportedLanguages(),
        defaultLanguage: TranslationService.getDefaultLanguage()
      }
    });
  } catch (error) {
    console.error('Error fetching section summary:', error);
    next(error);
  }
};

export const getSectionTables = async (req, res, next) => {
  const { sectionCode } = req.params;

  try {
    const result = await pool.query(`
      SELECT * FROM section_tables_detailed 
      WHERE section_code = $1 
      ORDER BY table_number
    `, [sectionCode.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tables found in this section"
      });
    }

    res.json({
      success: true,
      message: `Tables in section ${sectionCode} retrieved successfully`,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching section tables:', error);
    next(error);
  }
};

export const getTableById = async (req, res, next) => {
  const { tableId } = req.params;

  try {
    const result = await pool.query(`
      SELECT * FROM dashboard_tables 
      WHERE table_id = $1
    `, [tableId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    res.json({
      success: true,
      message: "Table details retrieved successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching table details:', error);
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  const { tableId } = req.params;
  const { is_occupied, assigned_server } = req.body;

  try {
    const updateQuery = `
      UPDATE tables 
      SET 
        is_occupied = $1,
        assigned_server = $2,
        occupied_since = CASE 
          WHEN $1 = true AND is_occupied = false THEN CURRENT_TIMESTAMP
          WHEN $1 = false THEN NULL
          ELSE occupied_since
        END
      WHERE table_id = $3
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [is_occupied, assigned_server, tableId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    res.json({
      success: true,
      message: "Table status updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating table status:', error);
    next(error);
  }
};


//TODO PLACEHOLDER FUNCTIONS


export const getTableOrders = async (req, res, next) => {
  res.json({
    success: true,
    message: "Table orders endpoint - to be implemented",
    data: []
  });
};

export const createTableOrder = async (req, res, next) => {
  res.json({
    success: true,
    message: "Create table order endpoint - to be implemented",
    data: {}
  });
};

export const getActiveTableOrder = async (req, res, next) => {
  res.json({
    success: true,
    message: "Active table order endpoint - to be implemented",
    data: null
  });
};
