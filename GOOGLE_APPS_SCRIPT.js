// ============================================================
// UPDATED Google Apps Script - Deploy to script.google.com
// ============================================================
// ALL operations use GET (via doGet) to avoid Android POST issues
// Data is passed as URL parameter: ?action=xxx&data=JSON
//
// SETUP:
// 1. Go to https://script.google.com
// 2. Open your existing project (or create new)
// 3. Replace ALL code with this script
// 4. Click Deploy > Manage Deployments > Edit > New version
// 5. Deploy as Web App: Execute as "Me", Access "Anyone"
// 6. Copy the new URL to your .env file
//
// SHEETS:
// - "Sheet1" (Products): code | name | price | category | stock
// - "Orders"  (auto-created): orderId | items | subtotal | tax | total | timestamp
// ============================================================

function doGet(e) {
    var action = e.parameter.action;
    var rawData = e.parameter.data;
    var data = null;

    // Parse data parameter if present
    if (rawData) {
        try {
            data = JSON.parse(rawData);
        } catch (err) {
            return jsonResponse({ success: false, error: 'Invalid JSON data: ' + err.message });
        }
    }

    switch (action) {
        case 'getProducts':
            return getProducts_();
        case 'addProduct':
            return addProduct_(data);
        case 'updateProduct':
            return updateProduct_(data);
        case 'deleteProduct':
            return deleteProduct_(data);
        case 'saveOrder':
            return saveOrder_(data);
        case 'getOrders':
            return getOrders_(e.parameter);
        case 'getSalesSummary':
            return getSalesSummary_(data ? data.period : e.parameter.period);
        case 'updateStock':
            return updateStockLevels_(data);
        default:
            return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
}

// Keep doPost for backward compatibility
function doPost(e) {
    try {
        var body = JSON.parse(e.postData.contents);
        // Re-route to doGet handler
        return doGet({
            parameter: {
                action: body.action,
                data: JSON.stringify(body.data || body)
            }
        });
    } catch (err) {
        return jsonResponse({ success: false, error: 'POST parse error: ' + err.message });
    }
}

// ─── Helper ───────────────────────────────────────────────

function jsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        if (name === 'Orders') {
            sheet.appendRow(['OrderID', 'Items', 'Subtotal', 'Tax', 'Total', 'Timestamp', 'ItemCount']);
        }
    }
    return sheet;
}

// ─── Products ─────────────────────────────────────────────

function getProducts_() {
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
        if (!sheet) return jsonResponse({ success: false, error: 'Sheet1 not found' });

        var data = sheet.getDataRange().getValues();
        if (data.length <= 1) return jsonResponse({ success: true, data: [] });

        var headers = data[0];
        var products = [];
        for (var i = 1; i < data.length; i++) {
            var product = {};
            for (var j = 0; j < headers.length; j++) {
                product[String(headers[j]).toLowerCase()] = data[i][j];
            }
            products.push(product);
        }

        return jsonResponse({ success: true, data: products });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message });
    }
}

function addProduct_(data) {
    try {
        if (!data || !data.code || !data.name || !data.price) {
            return jsonResponse({ success: false, error: 'Missing required fields: code, name, price' });
        }

        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
        sheet.appendRow([
            String(data.code),
            String(data.name),
            Number(data.price),
            String(data.category || 'General'),
            Number(data.stock || 1)
        ]);

        return jsonResponse({ success: true });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message });
    }
}

function updateProduct_(data) {
    try {
        if (!data || !data.code) {
            return jsonResponse({ success: false, error: 'Missing product code' });
        }

        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
        var rows = sheet.getDataRange().getValues();

        for (var i = 1; i < rows.length; i++) {
            if (String(rows[i][0]) === String(data.code)) {
                if (data.name) sheet.getRange(i + 1, 2).setValue(data.name);
                if (data.price) sheet.getRange(i + 1, 3).setValue(Number(data.price));
                if (data.category) sheet.getRange(i + 1, 4).setValue(data.category);
                if (data.stock !== undefined) sheet.getRange(i + 1, 5).setValue(Number(data.stock));
                return jsonResponse({ success: true });
            }
        }

        return jsonResponse({ success: false, error: 'Product not found' });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message });
    }
}

function deleteProduct_(data) {
    try {
        if (!data || !data.code) {
            return jsonResponse({ success: false, error: 'Missing product code' });
        }

        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
        var rows = sheet.getDataRange().getValues();

        for (var i = 1; i < rows.length; i++) {
            if (String(rows[i][0]) === String(data.code)) {
                sheet.deleteRow(i + 1);
                return jsonResponse({ success: true });
            }
        }

        return jsonResponse({ success: false, error: 'Product not found' });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message });
    }
}

// ─── Orders ───────────────────────────────────────────────

function saveOrder_(data) {
    try {
        if (!data) return jsonResponse({ success: false, error: 'No order data' });

        var sheet = getOrCreateSheet('Orders');

        sheet.appendRow([
            data.orderId || '',
            JSON.stringify(data.items || []),
            Number(data.subtotal || 0),
            Number(data.taxAmount || 0),
            Number(data.total || 0),
            data.timestamp || new Date().toISOString(),
            Number(data.itemCount || 0)
        ]);

        return jsonResponse({ success: true, orderId: data.orderId });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message });
    }
}

function getOrders_(params) {
    try {
        var sheet = getOrCreateSheet('Orders');
        var data = sheet.getDataRange().getValues();
        if (data.length <= 1) return jsonResponse({ success: true, data: [] });

        var orders = [];
        for (var i = 1; i < data.length; i++) {
            var items = data[i][1];
            try { items = JSON.parse(items); } catch (e) { items = []; }

            orders.push({
                orderId: data[i][0],
                items: items,
                subtotal: data[i][2],
                taxAmount: data[i][3],
                total: data[i][4],
                timestamp: data[i][5],
                itemCount: data[i][6]
            });
        }

        // Filter by date if provided
        if (params.startDate) {
            orders = orders.filter(function (o) { return o.timestamp >= params.startDate; });
        }
        if (params.endDate) {
            orders = orders.filter(function (o) { return o.timestamp <= params.endDate; });
        }

        // Limit and reverse (newest first)
        var limit = parseInt(params.limit) || 100;
        orders = orders.slice(-limit).reverse();

        return jsonResponse({ success: true, data: orders });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message });
    }
}

function getSalesSummary_(period) {
    try {
        var sheet = getOrCreateSheet('Orders');
        var data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
            return jsonResponse({ success: true, data: { totalSales: 0, totalOrders: 0, totalItems: 0, averageOrder: 0 } });
        }

        var now = new Date();
        var startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(0);
        }

        var filtered = [];
        for (var i = 1; i < data.length; i++) {
            if (new Date(data[i][5]) >= startDate) {
                filtered.push(data[i]);
            }
        }

        var totalSales = 0;
        var totalItems = 0;
        for (var j = 0; j < filtered.length; j++) {
            totalSales += (Number(filtered[j][4]) || 0);
            totalItems += (Number(filtered[j][6]) || 0);
        }

        return jsonResponse({
            success: true,
            data: {
                totalSales: totalSales,
                totalOrders: filtered.length,
                totalItems: totalItems,
                averageOrder: filtered.length > 0 ? totalSales / filtered.length : 0
            }
        });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message });
    }
}

// ─── Stock Management ─────────────────────────────────────

function updateStockLevels_(items) {
    try {
        if (!items || !items.length) return jsonResponse({ success: false, error: 'No items provided' });

        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
        var data = sheet.getDataRange().getValues();

        for (var k = 0; k < items.length; k++) {
            for (var i = 1; i < data.length; i++) {
                if (String(data[i][0]) === String(items[k].code)) {
                    var currentStock = Number(data[i][4]) || 0;
                    var newStock = Math.max(0, currentStock - (Number(items[k].quantitySold) || 0));
                    sheet.getRange(i + 1, 5).setValue(newStock);
                    break;
                }
            }
        }

        return jsonResponse({ success: true });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message });
    }
}
