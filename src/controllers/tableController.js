import {
  getAllTablesService,
  getTableByIdService,
  createTableService,
  deleteTableService,
  updateTableStatusService,
  updateTableReservationService,
  getDashboardStatsService,
  getTableSectionsService,
  getSectionSummaryService,
  getSectionTablesService
} from "../models/tableModel.js";

export const getAllTables = async (req, res, next) => {
  try {
    const tables = await getAllTablesService();
    res.json({
      success: true,
      message: "Tables retrieved successfully",
      data: tables
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStatsService();
    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

export const getTableSections = async (req, res, next) => {
  try {
    const sections = await getTableSectionsService();
    res.json({
      success: true,
      message: "Table sections retrieved successfully",
      data: sections
    });
  } catch (error) {
    console.error('Error fetching table sections:', error);
    next(error);
  }
};

export const getSectionSummary = async (req, res, next) => {
  try {
    const summary = await getSectionSummaryService();
    res.json({
      success: true,
      message: "Section summary retrieved successfully",
      data: summary
    });
  } catch (error) {
    console.error('Error fetching section summary:', error);
    next(error);
  }
};

export const getSectionTables = async (req, res, next) => {
  const { sectionCode } = req.params;

  try {
    const tables = await getSectionTablesService(sectionCode);

    if (tables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tables found in this section"
      });
    }

    res.json({
      success: true,
      message: `Tables in section ${sectionCode} retrieved successfully`,
      data: tables
    });
  } catch (error) {
    console.error('Error fetching section tables:', error);
    next(error);
  }
};

export const getTableById = async (req, res, next) => {
  const { tableId } = req.params;

  try {
    const table = await getTableByIdService(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    res.json({
      success: true,
      message: "Table details retrieved successfully",
      data: table
    });
  } catch (error) {
    console.error('Error fetching table details:', error);
    next(error);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const tableData = req.body;
    const newTable = await createTableService(tableData);

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: newTable
    });
  } catch (error) {
    console.error('Error creating table:', error);
    
    // Handle specific validation errors
    if (error.message.includes('Invalid table ID format') || 
        error.message.includes('Invalid capacity') ||
        error.message.includes('already exists') ||
        error.message.includes('Invalid server ID')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  const { tableId } = req.params;

  try {
    const deletedTable = await deleteTableService(tableId);

    res.json({
      success: true,
      message: `Table ${tableId} deleted successfully`,
      data: deletedTable
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    
    // Handle specific business logic errors
    if (error.message.includes('not found') ||
        error.message.includes('currently occupied') ||
        error.message.includes('currently reserved') ||
        error.message.includes('active orders') ||
        error.message.includes('active reservations')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  const { tableId } = req.params;
  const statusData = req.body;

  try {
    const updatedTable = await updateTableStatusService(tableId, statusData);

    res.json({
      success: true,
      message: "Table status updated successfully",
      data: updatedTable
    });
  } catch (error) {
    console.error('Error updating table status:', error);
    
    // Handle specific validation errors
    if (error.message.includes('not found') ||
        error.message.includes('cannot be both occupied and reserved') ||
        error.message.includes('Invalid server ID')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

export const updateTableReservationStatus = async (req, res, next) => {
  const { tableId } = req.params;
  const reservationData = req.body;

  try {
    const updatedTable = await updateTableReservationService(tableId, reservationData);

    res.json({
      success: true,
      message: reservationData.is_reserved ? "Table marked as reserved" : "Table reservation removed",
      data: updatedTable
    });
  } catch (error) {
    console.error('Error updating table reservation status:', error);
    
    // Handle specific validation errors
    if (error.message.includes('not found') ||
        error.message.includes('Invalid server ID')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
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
