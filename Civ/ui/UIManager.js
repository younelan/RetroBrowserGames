import { TechnologyData, EraInfo } from '../systems/Research.js';
import { GovernmentType, PolicyType } from '../systems/Government.js';
import { DiplomaticStatus } from '../systems/Diplomacy.js';
import { BuildingType, WonderType } from '../entities/City.js';
import { UnitType, PromotionType } from '../entities/Unit.js';

// ============================================================================
//  UIManager  --  Complete UI layer for the Civilization game
// ============================================================================

const NOTIFICATION_COLORS = {
    combat:     '#ff7b72',
    diplomacy:  '#79c0ff',
    production: '#7ee787',
    research:   '#bc8cff',
    default:    '#58a6ff',
    warning:    '#f2cc60',
    error:      '#ff4444'
};

const ERA_COLORS = {
    ancient:     '#c9a227',
    classical:   '#8b6bbf',
    medieval:    '#5a9e50',
    renaissance: '#c0763c',
    industrial:  '#7088a8'
};

const SAVE_KEY = 'civ_save_game';
const AUTOSAVE_KEY = 'civ_autosave';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.notificationQueue = [];
        this.activeTooltip = null;
        this.lastEra = 'ancient';
        this.startScreenActive = false;
        this.selectedUnitIndex = 0;

        this.setupListeners();
        this.setupKeyboardShortcuts();
        this.injectStyles();
    }

    // ========================================================================
    //  INITIAL SETUP
    // ========================================================================

    setupListeners() {
        document.getElementById('end-turn-btn').addEventListener('click', () => {
            if (this.startScreenActive) return;
            this.handleEndTurnClick();
        });

        document.getElementById('research-tracker').addEventListener('click', () => {
            this.showTechTree();
        });

        document.getElementById('help-btn').addEventListener('click', () => {
            this.showHelp();
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (this.startScreenActive) return;

            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();

            switch (key) {
                case 'escape':
                    this.closeModal();
                    break;
                case ' ':
                    e.preventDefault();
                    this.handleEndTurnClick();
                    break;
                case 'n':
                    this.selectNextUnitWithMoves();
                    break;
                case 'f':
                    this.shortcutFortify();
                    break;
                case 's':
                    this.shortcutSkipTurn();
                    break;
                case 't':
                    this.showTechTree();
                    break;
                case 'd':
                    this.showDiplomacyScreen();
                    break;
                case 'g':
                    this.showGovernmentScreen();
                    break;
                case 'tab':
                    e.preventDefault();
                    this.cycleUnits();
                    break;
            }
        });
    }

    // ========================================================================
    //  DYNAMIC CSS INJECTION
    // ========================================================================

    injectStyles() {
        if (document.getElementById('ui-manager-styles')) return;
        const style = document.createElement('style');
        style.id = 'ui-manager-styles';
        style.textContent = `
            /* ---- Notification system ---- */
            .notif-item {
                padding: 0.65rem 1.4rem;
                margin-bottom: 0.5rem;
                border-radius: 6px;
                font-size: 0.78rem;
                font-weight: 700;
                letter-spacing: 0.4px;
                pointer-events: none;
                text-transform: uppercase;
                backdrop-filter: blur(10px);
                border-left: 4px solid var(--accent-color);
                background: rgba(13,20,36,0.85);
                opacity: 1;
                transition: opacity 0.6s ease-out, transform 0.4s ease-out;
                animation: notifSlideIn 0.35s cubic-bezier(0.16,1,0.3,1);
            }
            .notif-item.fade-out {
                opacity: 0;
                transform: translateY(-12px);
            }
            @keyframes notifSlideIn {
                from { opacity: 0; transform: translateY(20px) scale(0.96); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }

            /* ---- Tech tree graph ---- */
            .tech-tree-container {
                position: relative;
                width: 100%;
                min-height: 100%;
                overflow: auto;
            }
            .tech-tree-canvas-wrap {
                position: relative;
            }
            .tech-tree-svg {
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 0;
            }
            .tech-tree-nodes {
                position: relative;
                z-index: 1;
            }
            .tech-era-section {
                margin-bottom: 24px;
            }
            .tech-era-label {
                font-weight: 900;
                font-size: 0.85rem;
                letter-spacing: 2px;
                text-transform: uppercase;
                padding: 8px 16px;
                margin-bottom: 12px;
                border-radius: 4px;
                display: inline-block;
            }
            .tech-era-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }
            .tech-node {
                padding: 14px 16px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.25s;
                width: 165px;
                position: relative;
            }
            .tech-node:hover {
                border-color: var(--accent-color);
                background: rgba(88,166,255,0.08);
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            }
            .tech-node.unlocked {
                background: rgba(46,160,67,0.15);
                border-color: rgba(46,160,67,0.5);
            }
            .tech-node.available {
                background: rgba(88,166,255,0.1);
                border-color: rgba(88,166,255,0.4);
                box-shadow: 0 0 8px rgba(88,166,255,0.15);
            }
            .tech-node.researching {
                background: rgba(88,166,255,0.2);
                border-color: var(--accent-color);
                box-shadow: 0 0 16px rgba(88,166,255,0.35);
                animation: techPulse 2s ease-in-out infinite;
            }
            .tech-node.locked {
                opacity: 0.4;
                cursor: default;
            }
            @keyframes techPulse {
                0%, 100% { box-shadow: 0 0 10px rgba(88,166,255,0.25); }
                50%      { box-shadow: 0 0 22px rgba(88,166,255,0.5); }
            }
            .tech-name {
                font-weight: 700;
                font-size: 0.85rem;
                margin-bottom: 4px;
            }
            .tech-cost {
                font-size: 0.68rem;
                color: var(--text-dim);
                margin-bottom: 4px;
            }
            .tech-unlocks {
                font-size: 0.62rem;
                color: var(--science);
                line-height: 1.4;
            }
            .tech-state-badge {
                position: absolute;
                top: 6px;
                right: 8px;
                font-size: 0.55rem;
                font-weight: 800;
                letter-spacing: 0.5px;
                padding: 2px 6px;
                border-radius: 3px;
                text-transform: uppercase;
            }

            /* ---- Diplomacy screen ---- */
            .diplo-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 20px;
                padding: 10px;
            }
            .diplo-card {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px;
                padding: 20px;
                transition: border-color 0.2s;
            }
            .diplo-card:hover {
                border-color: rgba(255,255,255,0.2);
            }
            .diplo-header {
                display: flex;
                align-items: center;
                gap: 14px;
                margin-bottom: 14px;
            }
            .diplo-civ-icon {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: 900;
                border: 2px solid;
            }
            .diplo-civ-name {
                font-weight: 800;
                font-size: 1.1rem;
            }
            .diplo-status {
                font-size: 0.72rem;
                font-weight: 600;
                padding: 3px 8px;
                border-radius: 3px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: inline-block;
                margin-top: 4px;
            }
            .diplo-opinion {
                font-size: 0.78rem;
                color: var(--text-dim);
                margin-bottom: 12px;
            }
            .diplo-deals {
                font-size: 0.72rem;
                color: var(--text-dim);
                margin-bottom: 14px;
                padding: 8px;
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
            }
            .diplo-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .diplo-btn {
                padding: 6px 12px;
                font-size: 0.7rem;
                font-weight: 700;
                border-radius: 5px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.04);
                color: var(--text-main);
                cursor: pointer;
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            .diplo-btn:hover {
                background: rgba(255,255,255,0.12);
                border-color: rgba(255,255,255,0.25);
                transform: translateY(-1px);
            }
            .diplo-btn.war { border-color: #ff4444; color: #ff7b72; }
            .diplo-btn.war:hover { background: rgba(255,68,68,0.15); }
            .diplo-btn.peace { border-color: #7ee787; color: #7ee787; }
            .diplo-btn.peace:hover { background: rgba(126,231,135,0.15); }
            .diplo-btn.alliance { border-color: #f2cc60; color: #f2cc60; }
            .diplo-btn.alliance:hover { background: rgba(242,204,96,0.15); }

            /* ---- Government screen ---- */
            .gov-screen { padding: 10px; }
            .gov-current {
                background: rgba(88,166,255,0.08);
                border: 1px solid rgba(88,166,255,0.3);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 24px;
            }
            .gov-current-title {
                font-size: 1.4rem;
                font-weight: 900;
                margin-bottom: 6px;
            }
            .gov-section-title {
                font-size: 0.8rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: var(--text-dim);
                margin-bottom: 12px;
                margin-top: 20px;
            }
            .gov-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 12px;
            }
            .gov-card {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .gov-card:hover {
                border-color: var(--accent-color);
                background: rgba(88,166,255,0.06);
                transform: translateY(-2px);
            }
            .gov-card.active {
                border-color: #7ee787;
                background: rgba(126,231,135,0.08);
            }
            .gov-card-name {
                font-weight: 800;
                font-size: 1rem;
                margin-bottom: 4px;
            }
            .gov-card-desc {
                font-size: 0.72rem;
                color: var(--text-dim);
                margin-bottom: 8px;
                line-height: 1.4;
            }
            .gov-card-bonuses {
                font-size: 0.68rem;
                color: #7ee787;
                line-height: 1.5;
            }
            .gov-card-penalties {
                font-size: 0.68rem;
                color: #ff7b72;
                line-height: 1.5;
            }

            /* ---- Policy slots ---- */
            .policy-slots {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                flex-wrap: wrap;
            }
            .policy-slot {
                width: 44px;
                height: 44px;
                border: 2px dashed rgba(255,255,255,0.15);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.65rem;
                color: var(--text-dim);
            }
            .policy-slot.filled {
                border-style: solid;
                border-color: var(--accent-color);
                background: rgba(88,166,255,0.1);
                font-size: 0.55rem;
                color: var(--text-main);
                font-weight: 700;
                text-align: center;
                padding: 2px;
                line-height: 1.1;
                cursor: pointer;
            }

            /* ---- Policy grid ---- */
            .policy-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 10px;
            }
            .policy-card {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 6px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .policy-card:hover {
                border-color: var(--accent-color);
                background: rgba(88,166,255,0.06);
            }
            .policy-card.active {
                border-color: #7ee787;
                background: rgba(126,231,135,0.08);
            }
            .policy-card-name {
                font-weight: 700;
                font-size: 0.82rem;
                margin-bottom: 3px;
            }
            .policy-card-category {
                font-size: 0.62rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--text-dim);
                margin-bottom: 4px;
            }
            .policy-card-desc {
                font-size: 0.7rem;
                color: var(--science);
                line-height: 1.3;
            }

            /* ---- Demographics ---- */
            .demo-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.82rem;
            }
            .demo-table th {
                text-align: left;
                padding: 10px 14px;
                font-weight: 800;
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-dim);
                border-bottom: 1px solid rgba(255,255,255,0.08);
            }
            .demo-table td {
                padding: 10px 14px;
                border-bottom: 1px solid rgba(255,255,255,0.04);
            }
            .demo-table tr.player-row td {
                color: var(--accent-color);
                font-weight: 700;
            }
            .demo-rank {
                font-weight: 800;
                font-size: 0.75rem;
                color: var(--gold);
            }

            /* ---- Promotion UI ---- */
            .promo-container {
                border: 1px solid rgba(188,140,255,0.3);
                background: rgba(188,140,255,0.06);
                border-radius: 8px;
                padding: 12px;
                margin-top: 10px;
            }
            .promo-title {
                font-weight: 800;
                font-size: 0.75rem;
                color: var(--culture);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
            }
            .promo-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .promo-btn {
                padding: 8px 12px;
                font-size: 0.72rem;
                font-weight: 700;
                border-radius: 6px;
                border: 1px solid rgba(188,140,255,0.3);
                background: rgba(188,140,255,0.08);
                color: var(--text-main);
                cursor: pointer;
                transition: all 0.2s;
            }
            .promo-btn:hover {
                background: rgba(188,140,255,0.2);
                border-color: var(--culture);
                transform: translateY(-1px);
            }
            .promo-btn-desc {
                font-size: 0.6rem;
                color: var(--text-dim);
                margin-top: 2px;
            }

            /* ---- End turn button states ---- */
            .end-turn-pulse {
                animation: endTurnPulse 1.5s ease-in-out infinite;
            }
            @keyframes endTurnPulse {
                0%, 100% { box-shadow: 0 0 10px rgba(88,166,255,0.3); }
                50%      { box-shadow: 0 0 28px rgba(88,166,255,0.7), 0 0 6px rgba(88,166,255,0.4) inset; }
            }
            .end-turn-next-unit {
                background: linear-gradient(135deg, rgba(242,204,96,0.2), rgba(242,204,96,0.4)) !important;
                border-color: var(--gold) !important;
            }

            /* ---- Era banner ---- */
            .era-banner {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                pointer-events: none;
                animation: eraBannerAnim 3.5s ease-out forwards;
            }
            .era-banner-bg {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7);
                animation: eraBgFade 3.5s ease-out forwards;
            }
            @keyframes eraBgFade {
                0%   { opacity: 0; }
                15%  { opacity: 1; }
                75%  { opacity: 1; }
                100% { opacity: 0; }
            }
            @keyframes eraBannerAnim {
                0%   { opacity: 0; }
                15%  { opacity: 1; }
                75%  { opacity: 1; }
                100% { opacity: 0; pointer-events: none; }
            }
            .era-banner-text {
                position: relative;
                z-index: 1;
                font-size: 3.5rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 8px;
                text-shadow: 0 0 40px currentColor;
                animation: eraTitleSlide 3.5s ease-out forwards;
            }
            .era-banner-sub {
                position: relative;
                z-index: 1;
                font-size: 1.2rem;
                letter-spacing: 3px;
                color: var(--text-dim);
                margin-top: 10px;
                text-transform: uppercase;
                animation: eraTitleSlide 3.5s ease-out forwards;
            }
            @keyframes eraTitleSlide {
                0%   { transform: translateY(30px); opacity: 0; }
                20%  { transform: translateY(0); opacity: 1; }
                75%  { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-20px); opacity: 0; }
            }

            /* ---- Start screen ---- */
            .start-screen {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(160deg, #030a16 0%, #0d1a30 40%, #1a0d2e 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .start-title {
                font-size: 5rem;
                font-weight: 900;
                letter-spacing: 18px;
                text-transform: uppercase;
                background: linear-gradient(135deg, #f2cc60, #ff7b72, #bc8cff, #58a6ff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 6px;
                animation: titleGlow 4s ease-in-out infinite alternate;
            }
            @keyframes titleGlow {
                0%   { filter: drop-shadow(0 0 20px rgba(242,204,96,0.3)); }
                50%  { filter: drop-shadow(0 0 40px rgba(88,166,255,0.4)); }
                100% { filter: drop-shadow(0 0 20px rgba(188,140,255,0.3)); }
            }
            .start-subtitle {
                font-size: 1rem;
                letter-spacing: 6px;
                color: var(--text-dim);
                text-transform: uppercase;
                margin-bottom: 60px;
            }
            .start-options {
                display: flex;
                flex-direction: column;
                gap: 24px;
                min-width: 380px;
                max-width: 420px;
            }
            .start-option {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .start-label {
                font-weight: 700;
                font-size: 0.9rem;
                letter-spacing: 0.5px;
            }
            .start-select {
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.12);
                color: var(--text-main);
                padding: 10px 16px;
                border-radius: 6px;
                font-family: 'Outfit', sans-serif;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                min-width: 180px;
                appearance: none;
                -webkit-appearance: none;
                outline: none;
                transition: border-color 0.2s;
            }
            .start-select:hover, .start-select:focus {
                border-color: var(--accent-color);
            }
            .start-select option {
                background: #0d1117;
                color: var(--text-main);
            }
            .start-btn {
                margin-top: 30px;
                padding: 18px 48px;
                font-size: 1.1rem;
                font-weight: 800;
                letter-spacing: 3px;
                text-transform: uppercase;
                background: linear-gradient(135deg, rgba(88,166,255,0.2), rgba(88,166,255,0.45));
                border: 2px solid var(--accent-color);
                color: var(--text-main);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 0 24px rgba(88,166,255,0.2);
            }
            .start-btn:hover {
                background: linear-gradient(135deg, rgba(88,166,255,0.35), rgba(88,166,255,0.6));
                transform: translateY(-3px);
                box-shadow: 0 6px 30px rgba(88,166,255,0.35);
            }
            .start-btn:active {
                transform: translateY(0);
            }

            /* ---- Save/Load menu ---- */
            .save-menu {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .save-menu-btn {
                padding: 5px 12px;
                font-size: 0.68rem;
                font-weight: 700;
                border-radius: 5px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.04);
                color: var(--text-main);
                cursor: pointer;
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            .save-menu-btn:hover {
                background: rgba(255,255,255,0.12);
                border-color: rgba(255,255,255,0.25);
            }

            /* ---- City detail panel ---- */
            .city-detail-section {
                margin-top: 10px;
                padding: 10px;
                background: rgba(255,255,255,0.03);
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.05);
            }
            .city-detail-title {
                font-size: 0.68rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-dim);
                margin-bottom: 6px;
            }
            .city-yield-row {
                display: flex;
                justify-content: space-between;
                font-size: 0.72rem;
                padding: 3px 0;
                border-bottom: 1px solid rgba(255,255,255,0.03);
            }
            .city-yield-row:last-child {
                border-bottom: none;
            }
            .specialist-controls {
                display: flex;
                gap: 4px;
                align-items: center;
                margin-top: 2px;
            }
            .specialist-btn {
                width: 22px;
                height: 22px;
                border-radius: 4px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.04);
                color: var(--text-main);
                font-size: 0.7rem;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
            }
            .specialist-btn:hover {
                background: rgba(255,255,255,0.1);
                border-color: var(--accent-color);
            }

            /* ---- Help screen grid ---- */
            .help-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                padding: 20px;
                line-height: 1.6;
                font-size: 0.95rem;
                height: 100%;
                overflow-y: auto;
            }
            .help-section {
                margin-bottom: 20px;
            }
            .help-section h3 {
                margin-bottom: 8px;
            }
            .help-kbd {
                display: inline-block;
                padding: 2px 7px;
                border-radius: 4px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.78rem;
                font-weight: 700;
                margin: 0 2px;
            }

            /* ---- Connection lines in tech tree (SVG) ---- */
            .tech-connection-line {
                stroke: rgba(255,255,255,0.12);
                stroke-width: 2;
                fill: none;
            }
            .tech-connection-line.unlocked {
                stroke: rgba(46,160,67,0.5);
                stroke-width: 2.5;
            }
        `;
        document.body.appendChild(style);
    }

    // ========================================================================
    //  START SCREEN
    // ========================================================================

    showStartScreen(callback) {
        this.startScreenActive = true;

        const overlay = document.createElement('div');
        overlay.className = 'start-screen';
        overlay.id = 'start-screen-overlay';
        overlay.innerHTML = `
            <div class="start-title">CIVILIZATION</div>
            <div class="start-subtitle">Empire Builder</div>
            <div class="start-options">
                <div class="start-option">
                    <span class="start-label">Map Size</span>
                    <select id="start-map-size" class="start-select">
                        <option value="small">Small (40 x 40)</option>
                        <option value="standard" selected>Standard (60 x 60)</option>
                        <option value="large">Large (80 x 80)</option>
                    </select>
                </div>
                <div class="start-option">
                    <span class="start-label">AI Opponents</span>
                    <select id="start-num-ai" class="start-select">
                        <option value="2">2 Civilizations</option>
                        <option value="3" selected>3 Civilizations</option>
                        <option value="4">4 Civilizations</option>
                        <option value="5">5 Civilizations</option>
                    </select>
                </div>
                <button id="start-game-btn" class="start-btn">Start Game</button>
            </div>
        `;

        document.body.appendChild(overlay);

        const mapSizes = {
            small:    { w: 40, h: 40 },
            standard: { w: 60, h: 60 },
            large:    { w: 80, h: 80 }
        };

        document.getElementById('start-game-btn').addEventListener('click', () => {
            const sizeKey = document.getElementById('start-map-size').value;
            const numAI = parseInt(document.getElementById('start-num-ai').value, 10);
            const size = mapSizes[sizeKey];

            overlay.style.transition = 'opacity 0.6s';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                this.startScreenActive = false;
                callback({
                    mapWidth: size.w,
                    mapHeight: size.h,
                    numAI: numAI
                });
            }, 600);
        });
    }

    // ========================================================================
    //  HUD UPDATE
    // ========================================================================

    updateHUD(player) {
        // Gold
        const goldRate = player.cities.reduce((sum, c) => sum + c.calculateYields().gold, 0);
        const goldEl = document.getElementById('stat-gold');
        goldEl.innerHTML = `${Math.floor(player.gold)} <span class="rate">(${goldRate >= 0 ? '+' : ''}${Math.floor(goldRate)})</span>`;

        // Science
        const scienceRate = player.cities.reduce((sum, c) => sum + c.calculateYields().science, 0);
        const sciEl = document.getElementById('stat-science');
        sciEl.innerHTML = `${Math.floor(player.science)} <span class="rate">(+${Math.floor(scienceRate)})</span>`;

        // Happiness
        const hEl = document.getElementById('stat-happiness');
        hEl.textContent = Math.round(player.happiness);
        hEl.style.color = player.happiness < 0 ? '#ff7b72' : '#7ee787';

        // Resources
        const statsGroup = document.querySelector('.stats-group');
        let resEl = document.getElementById('hud-resources');
        if (!resEl) {
            resEl = document.createElement('div');
            resEl.id = 'hud-resources';
            resEl.style.display = 'flex';
            resEl.style.gap = '12px';
            resEl.style.alignItems = 'center';
            statsGroup.appendChild(resEl);
        }
        resEl.innerHTML = '';
        const resources = [
            { label: 'Iron',   key: 'IRON',   icon: '&#9874;' },
            { label: 'Horses', key: 'HORSES', icon: '&#128014;' }
        ];
        resources.forEach(r => {
            const d = document.createElement('div');
            d.className = 'stat';
            d.title = `${r.label} (Strategic)`;
            d.innerHTML = `<span class="icon">${r.icon}</span> ${player.strategicResources[r.key]}`;
            resEl.appendChild(d);
        });

        // Turn
        document.getElementById('stat-turn').textContent = `TURN ${this.game.turn}`;

        // Year
        const year = 4000 - (this.game.turn - 1) * 40;
        document.getElementById('game-year').textContent = year > 0 ? `${year} BC` : `${Math.abs(year)} AD`;

        // Civ name
        document.getElementById('civ-name').textContent = player.name.toUpperCase();

        // Research tracker
        if (player.currentTech) {
            const tracker = document.getElementById('research-tracker');
            tracker.classList.remove('hidden');
            document.getElementById('current-tech-name').textContent = player.currentTech.name.toUpperCase();
            const pct = Math.min(100, (player.researchProgress / player.currentTech.cost) * 100);
            document.getElementById('tech-progress-bar').style.width = `${pct}%`;
        } else {
            document.getElementById('research-tracker').classList.add('hidden');
        }

        // City list
        this.updateCityList(player);

        // End-turn button state
        this.updateEndTurnButton(player);

        // Era check
        this.checkEraAdvancement(player);

        // Auto-save check
        this.checkAutoSave();

        // Inject save/load buttons in HUD if not present
        this.ensureSaveLoadButtons();
    }

    updateCityList(player) {
        const list = document.getElementById('city-list');
        if (!list) return;
        list.innerHTML = '';
        player.cities.forEach(city => {
            const div = document.createElement('div');
            div.className = 'city-item';
            const yields = city.calculateYields();
            div.innerHTML = `
                <div class="city-item-name">${city.name}${city.isCapital ? ' *' : ''}</div>
                <div class="city-item-stats">Pop ${city.population} | +${Math.floor(yields.food)}F +${Math.floor(yields.production)}P</div>
            `;
            div.onclick = () => {
                this.game.centerOn(city);
                this.game.handleHexClick(city.q, city.r);
            };
            list.appendChild(div);
        });
    }

    updateEndTurnButton(player) {
        const btn = document.getElementById('end-turn-btn');
        if (!btn) return;

        const unitsWithMoves = player.units.filter(u => u.movementPoints > 0 && u.task === 'Ready');

        if (unitsWithMoves.length > 0) {
            btn.textContent = 'NEXT UNIT';
            btn.classList.add('end-turn-next-unit');
            btn.classList.remove('end-turn-pulse');
        } else {
            btn.textContent = 'END TURN';
            btn.classList.remove('end-turn-next-unit');
            btn.classList.add('end-turn-pulse');
        }
    }

    handleEndTurnClick() {
        const player = this.game.getCurrentPlayer();
        const unitsWithMoves = player.units.filter(u => u.movementPoints > 0 && u.task === 'Ready');

        if (unitsWithMoves.length > 0) {
            this.selectNextUnitWithMoves();
        } else {
            this.game.endTurn();
        }
    }

    // ========================================================================
    //  ERA ADVANCEMENT
    // ========================================================================

    checkEraAdvancement(player) {
        if (player.currentEra && player.currentEra !== this.lastEra) {
            const oldEra = this.lastEra;
            this.lastEra = player.currentEra;
            // Only show for human player (index 0)
            if (player === this.game.players[0]) {
                this.showEraBanner(player.currentEra);
            }
        }
    }

    showEraBanner(era) {
        const info = EraInfo[era];
        if (!info) return;

        const banner = document.createElement('div');
        banner.className = 'era-banner';
        banner.innerHTML = `
            <div class="era-banner-bg"></div>
            <div class="era-banner-text" style="color: ${info.color}">${info.name}</div>
            <div class="era-banner-sub">A new age of discovery begins</div>
        `;
        document.body.appendChild(banner);

        setTimeout(() => banner.remove(), 4000);
    }

    // ========================================================================
    //  SELECTION PANEL
    // ========================================================================

    showSelection(entity) {
        const pane = document.getElementById('selection-pane');
        const header = document.getElementById('selection-header');
        const sub = document.getElementById('selection-sub');
        const icon = document.getElementById('selection-icon');
        const stats = document.getElementById('selection-stats');
        const actions = document.getElementById('selection-actions');

        pane.classList.remove('hidden');
        actions.innerHTML = '';
        stats.innerHTML = '';

        // --- Tile selection ---
        if (entity.type === 'tile') {
            this.renderTileSelection(entity.tile, icon, header, sub, stats);
            return;
        }

        // --- Unit selection ---
        if (entity.type && entity.type.name) {
            this.renderUnitSelection(entity, icon, header, sub, stats, actions);
            return;
        }

        // --- City selection ---
        if (entity.isCity) {
            this.renderCitySelection(entity, icon, header, sub, stats, actions);
            return;
        }
    }

    renderTileSelection(tile, icon, header, sub, stats) {
        icon.textContent = tile.terrain.icon;
        header.textContent = tile.terrain.name.toUpperCase();
        sub.textContent = `${tile.q}, ${tile.r}`;

        const yields = tile.getYield();
        this.addStat(stats, 'FOOD', yields.food, 'var(--food)');
        this.addStat(stats, 'PROD', yields.production, 'var(--production)');
        this.addStat(stats, 'GOLD', yields.gold, 'var(--gold)');
        if (yields.science) this.addStat(stats, 'SCIENCE', yields.science, 'var(--science)');

        if (tile.feature && tile.feature.name !== 'None') {
            this.addStat(stats, 'FEATURE', tile.feature.name);
        }
        if (tile.improvement) {
            this.addStat(stats, 'IMPROVEMENT', tile.improvement.name);
        }

        if (tile.resource && tile.resource.name !== 'None') {
            const resDiv = document.createElement('div');
            resDiv.style.cssText = 'grid-column:1/span 2;color:var(--gold);margin-top:8px;padding:8px;background:rgba(242,204,96,0.08);border:1px solid rgba(242,204,96,0.2);border-radius:4px;font-size:0.78rem;';
            resDiv.innerHTML = `<strong>${tile.resource.name.toUpperCase()}</strong> <span style="color:var(--text-dim)">(${tile.resource.type || 'resource'})</span>`;
            stats.appendChild(resDiv);
        }

        if (tile.village) {
            const vilDiv = document.createElement('div');
            vilDiv.style.cssText = 'grid-column:1/span 2;color:var(--accent-color);font-weight:700;margin-top:6px;';
            vilDiv.innerHTML = 'TRIBAL VILLAGE<br><small style="color:var(--text-dim)">Move a unit here to explore</small>';
            stats.appendChild(vilDiv);
        }
    }

    renderUnitSelection(unit, icon, header, sub, stats, actions) {
        icon.textContent = unit.type.icon;
        header.textContent = unit.type.name.toUpperCase();
        sub.textContent = unit.owner.name;

        // Health bar
        const healthColor = unit.health > 60 ? '#7ee787' : unit.health > 30 ? '#f2cc60' : '#ff7b72';
        this.addStat(stats, 'HP', `<span style="color:${healthColor}">${Math.round(unit.health)}%</span>`);
        this.addStat(stats, 'MOVES', `${unit.movementPoints}/${unit.type.move}`);

        if (unit.type.strength > 0) {
            this.addStat(stats, 'STR', unit.type.strength);
        }
        if (unit.type.rangedStrength) {
            this.addStat(stats, 'RANGED', `${unit.type.rangedStrength} (${unit.type.range})`);
        }

        // XP display
        if (unit.type.category === 'military') {
            this.addStat(stats, 'XP', `${unit.experience}/${unit.xpNeeded}`);
            this.addStat(stats, 'LEVEL', unit.level);
        }

        // Status
        const taskDiv = document.createElement('div');
        taskDiv.style.cssText = 'grid-column:1/span 2;color:var(--accent-color);font-size:0.72rem;margin-top:4px;';
        const workInfo = unit.workRemaining > 0 ? ` (${unit.workRemaining} turns)` : '';
        taskDiv.innerHTML = `<strong>STATUS:</strong> ${unit.task}${workInfo}`;
        stats.appendChild(taskDiv);

        // Promotions display
        if (unit.promotions.length > 0) {
            const promoDiv = document.createElement('div');
            promoDiv.style.cssText = 'grid-column:1/span 2;font-size:0.65rem;color:var(--culture);margin-top:4px;';
            promoDiv.innerHTML = unit.promotions.map(p => {
                const promo = PromotionType[p];
                return promo ? promo.name : p;
            }).join(', ');
            stats.appendChild(promoDiv);
        }

        // Promotion UI if available
        if (unit.canPromote()) {
            this.renderPromotionUI(unit, stats);
        }

        // Actions
        unit.type.actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'premium-btn';
            btn.textContent = action.toUpperCase();
            btn.onclick = (e) => {
                e.stopPropagation();
                this.game.handleAction(unit, action);
            };
            actions.appendChild(btn);
        });
    }

    renderPromotionUI(unit, container) {
        const available = unit.getAvailablePromotions();
        if (available.length === 0) return;

        const wrap = document.createElement('div');
        wrap.className = 'promo-container';
        wrap.style.gridColumn = '1 / span 2';

        let html = '<div class="promo-title">Promotion Available!</div><div class="promo-grid">';
        available.forEach(promo => {
            html += `
                <button class="promo-btn" data-promo-id="${promo.id}">
                    <div>${promo.name}</div>
                    <div class="promo-btn-desc">${promo.description}</div>
                </button>
            `;
        });
        html += '</div>';
        wrap.innerHTML = html;

        wrap.querySelectorAll('.promo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const promoId = btn.dataset.promoId;
                if (unit.promote(promoId)) {
                    this.notify(`${unit.type.name} promoted: ${PromotionType[promoId].name}!`, 'research');
                    this.showSelection(unit);
                }
            });
        });

        container.appendChild(wrap);
    }

    renderCitySelection(city, icon, header, sub, stats, actions) {
        icon.textContent = city.isCapital ? '&#127984;' : '&#127984;';
        header.textContent = city.name.toUpperCase();
        sub.textContent = `${city.owner.name} | Pop ${city.population}`;

        const yields = city.calculateYields();

        this.addStat(stats, 'FOOD', `+${Math.floor(yields.food)}`, 'var(--food)');
        this.addStat(stats, 'PROD', `+${Math.floor(yields.production)}`, 'var(--production)');
        this.addStat(stats, 'GOLD', `+${Math.floor(yields.gold)}`, 'var(--gold)');
        this.addStat(stats, 'SCIENCE', `+${Math.floor(yields.science)}`, 'var(--science)');
        this.addStat(stats, 'CULTURE', `+${Math.floor(yields.culture)}`, 'var(--culture)');
        this.addStat(stats, 'HAPPINESS', `${yields.happiness >= 0 ? '+' : ''}${yields.happiness}`);

        const foodNeeded = 15 + Math.pow(city.population, 1.8);
        this.addStat(stats, 'GROWTH', `${Math.floor(city.food)}/${Math.floor(foodNeeded)}`);
        this.addStat(stats, 'DEFENSE', `${Math.floor(city.getCityDefense())} (${Math.floor(city.cityHP)}/${city.maxCityHP})`);

        // Production queue
        if (city.productionQueue.length > 0) {
            const current = city.productionQueue[0];
            const qDiv = document.createElement('div');
            qDiv.style.cssText = 'grid-column:1/span 2;color:var(--production);font-size:0.72rem;margin-top:8px;background:rgba(255,123,114,0.06);padding:8px;border-radius:4px;border:1px solid rgba(255,123,114,0.15);';
            let html = `<strong>PRODUCING:</strong> ${current.name.toUpperCase()}`;
            if (current.cost > 0) {
                const turnsLeft = Math.max(1, Math.ceil((current.cost - city.productionStored) / Math.max(1, yields.production)));
                html += ` (${Math.floor(city.productionStored)}/${current.cost} ~ ${turnsLeft} turns)`;
            }
            if (city.productionQueue.length > 1) {
                html += `<br><span style="color:var(--text-dim);font-size:0.62rem">QUEUE: ${city.productionQueue.slice(1).map(i => i.name).join(', ')}</span>`;
            }
            qDiv.innerHTML = html;
            stats.appendChild(qDiv);
        }

        // Buildings detail
        this.renderCityBuildingYields(city, stats);

        // Specialists & Great Person progress
        this.renderCitySpecialists(city, stats);

        // ---- Actions ----

        // Rename
        const renameBtn = document.createElement('button');
        renameBtn.className = 'premium-btn';
        renameBtn.innerHTML = 'RENAME';
        renameBtn.onclick = (e) => { e.stopPropagation(); this.showRenameModal(city); };
        actions.appendChild(renameBtn);

        // Production options - grouped
        this.renderCityProductionOptions(city, actions);
    }

    renderCityBuildingYields(city, container) {
        if (city.buildings.size === 0) return;

        const section = document.createElement('div');
        section.className = 'city-detail-section';
        section.style.gridColumn = '1 / span 2';

        let html = '<div class="city-detail-title">Buildings</div>';
        city.buildings.forEach(bId => {
            const b = BuildingType[bId] || WonderType[bId];
            if (!b) return;
            const isWonder = !!WonderType[bId];
            html += `<div class="city-yield-row">
                <span style="${isWonder ? 'color:var(--gold);font-weight:700' : ''}">${b.name}</span>
                <span style="color:var(--text-dim);font-size:0.65rem">${b.description || ''}</span>
            </div>`;
        });
        section.innerHTML = html;
        container.appendChild(section);
    }

    renderCitySpecialists(city, container) {
        const section = document.createElement('div');
        section.className = 'city-detail-section';
        section.style.gridColumn = '1 / span 2';

        const specs = city.specialists;
        const gpPoints = city.greatPersonPoints;

        let html = '<div class="city-detail-title">Specialists & Great People</div>';

        const specTypes = [
            { key: 'scientist', label: 'Scientist', icon: '&#129514;', yield: '+3 Science', gpKey: 'scientist' },
            { key: 'merchant', label: 'Merchant', icon: '&#128188;', yield: '+3 Gold', gpKey: 'merchant' },
            { key: 'engineer', label: 'Engineer', icon: '&#128295;', yield: '+2 Production', gpKey: 'engineer' },
            { key: 'artist',   label: 'Artist',   icon: '&#127912;', yield: '+3 Culture', gpKey: null }
        ];

        specTypes.forEach(s => {
            const threshold = city.owner.greatPersonThreshold?.[s.gpKey] || 100;
            const points = s.gpKey ? (gpPoints[s.gpKey] || 0) : 0;
            html += `<div class="city-yield-row" style="align-items:center">
                <span>${s.icon} ${s.label}: ${specs[s.key]} <span style="color:var(--text-dim);font-size:0.62rem">(${s.yield})</span></span>
                <span class="specialist-controls">
                    <button class="specialist-btn" data-spec="${s.key}" data-dir="-1">-</button>
                    <span style="min-width:18px;text-align:center">${specs[s.key]}</span>
                    <button class="specialist-btn" data-spec="${s.key}" data-dir="1">+</button>
                    ${s.gpKey ? `<span style="font-size:0.58rem;color:var(--text-dim);margin-left:6px">${points}/${threshold} GP</span>` : ''}
                </span>
            </div>`;
        });

        section.innerHTML = html;

        // Specialist button handlers
        section.querySelectorAll('.specialist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = btn.dataset.spec;
                const dir = parseInt(btn.dataset.dir, 10);
                const currentVal = city.specialists[key] || 0;
                const newVal = currentVal + dir;
                // Cannot go below 0, cannot exceed population (rough limit)
                if (newVal >= 0 && newVal <= city.population) {
                    city.specialists[key] = newVal;
                    this.showSelection(city);
                }
            });
        });

        container.appendChild(section);
    }

    renderCityProductionOptions(city, actions) {
        // Units
        const availableUnits = Object.values(UnitType).filter(u => {
            if (u.techRequired && !city.owner.unlockedTechs.has(u.techRequired)) return false;
            return true;
        });

        // Buildings (filtered by canBuild)
        const availableBuildings = Object.entries(BuildingType).filter(([bId]) => city.canBuild(bId)).map(([, b]) => b);

        // Wonders
        const availableWonders = Object.entries(WonderType).filter(([wId, w]) => {
            if (this.game.wondersBuilt.has(wId)) return false;
            if (city.buildings.has(wId)) return false;
            if (w.tech && !city.owner.unlockedTechs.has(w.tech)) return false;
            if (w.requiresDesert) {
                // Check city terrain
                const tile = this.game.worldMap?.getTile(city.q, city.r);
                if (!tile || tile.terrain.name !== 'Desert') return false;
            }
            if (w.requiresMountain) {
                const neighbors = this.game.worldMap?.getNeighbors(city.q, city.r) || [];
                if (!neighbors.some(n => n.terrain.name === 'Mountain')) return false;
            }
            return true;
        }).map(([, w]) => w);

        // Special focuses
        const specials = [
            { name: 'Wealth', cost: 0, icon: '&#128176;', description: 'Convert 25% Production to Gold' },
            { name: 'Research', cost: 0, icon: '&#128300;', description: 'Convert 25% Production to Science' }
        ];

        const allOptions = [
            ...availableUnits.map(u => ({ ...u, optType: 'unit' })),
            ...availableBuildings.map(b => ({ ...b, optType: 'building' })),
            ...availableWonders.map(w => ({ ...w, optType: 'wonder' })),
            ...specials.map(s => ({ ...s, optType: 'special' }))
        ];

        allOptions.forEach(opt => {
            const btn = document.createElement('button');
            const isWonder = opt.optType === 'wonder';
            btn.className = isWonder ? 'premium-btn primary' : 'premium-btn';
            if (isWonder) btn.style.borderColor = 'var(--gold)';

            const costText = opt.cost > 0 ? ` (${opt.cost})` : '';
            btn.innerHTML = `<span style="font-size:0.8rem">${opt.icon || '&#127959;'}</span> ${opt.name.toUpperCase()}${costText}`;
            btn.title = opt.description || `Cost: ${opt.cost} | Shift+Click to purchase`;

            btn.onclick = (e) => {
                e.stopPropagation();
                if (e.shiftKey && opt.cost > 0) {
                    if (city.purchaseItem(opt)) {
                        this.notify(`Purchased ${opt.name}!`, 'production');
                        this.showSelection(city);
                        this.updateHUD(city.owner);
                    } else {
                        this.notify('Not enough gold!', 'warning');
                    }
                } else {
                    this.game.handleAction(city, `Build ${opt.name}`);
                    this.showSelection(city);
                }
            };
            actions.appendChild(btn);
        });
    }

    updateSelection() {
        if (this.game.selectedEntity) {
            this.showSelection(this.game.selectedEntity);
        }
    }

    addStat(container, label, value, color) {
        const div = document.createElement('div');
        const colorStyle = color ? `style="color:${color}"` : '';
        div.innerHTML = `<span style="color:var(--text-dim);font-size:0.7rem">${label}:</span> <span ${colorStyle}>${value}</span>`;
        container.appendChild(div);
    }

    hideSelection() {
        document.getElementById('selection-pane').classList.add('hidden');
    }

    // ========================================================================
    //  NOTIFICATIONS
    // ========================================================================

    notify(message, category = 'default') {
        const container = document.getElementById('notifications');
        const color = NOTIFICATION_COLORS[category] || NOTIFICATION_COLORS.default;

        const note = document.createElement('div');
        note.className = 'notif-item';
        note.style.borderLeftColor = color;
        note.textContent = message.toUpperCase();

        container.appendChild(note);

        // Limit visible notifications
        const children = container.children;
        if (children.length > 6) {
            children[0].remove();
        }

        // Auto-fade
        setTimeout(() => {
            note.classList.add('fade-out');
            setTimeout(() => {
                if (note.parentNode) note.remove();
            }, 600);
        }, 3500);
    }

    // ========================================================================
    //  TECH TREE
    // ========================================================================

    showTechTree() {
        const player = this.game.getCurrentPlayer();
        const techData = TechnologyData;
        const eraOrder = ['ancient', 'classical', 'medieval', 'renaissance', 'industrial'];
        const availableTechs = this.game.techTree.getAvailableTechs(player.unlockedTechs);
        const availableIds = new Set(availableTechs.map(t => t.id));

        // Group techs by era
        const grouped = {};
        eraOrder.forEach(era => { grouped[era] = []; });
        Object.values(techData).forEach(tech => {
            if (grouped[tech.era]) grouped[tech.era].push(tech);
        });

        // Build the tech tree layout
        let html = '<div class="tech-tree-container" id="tech-tree-graph">';

        // We will position nodes for SVG connections
        const nodePositions = {};
        let globalY = 0;

        eraOrder.forEach(era => {
            const eraInfo = EraInfo[era];
            const techs = grouped[era];
            const eraColor = ERA_COLORS[era] || '#fff';

            html += `<div class="tech-era-section" data-era="${era}">`;
            html += `<div class="tech-era-label" style="background:${eraColor}22;color:${eraColor};border:1px solid ${eraColor}44">${eraInfo.name}</div>`;
            html += `<div class="tech-era-grid">`;

            techs.forEach((tech, idx) => {
                const isUnlocked = player.unlockedTechs.has(tech.id);
                const isResearching = player.currentTech?.id === tech.id;
                const isAvailable = availableIds.has(tech.id);
                const isLocked = !isUnlocked && !isResearching && !isAvailable;

                let stateClass = 'locked';
                let badgeText = 'LOCKED';
                let badgeBg = 'rgba(255,255,255,0.06)';
                let badgeColor = 'var(--text-dim)';

                if (isUnlocked) {
                    stateClass = 'unlocked';
                    badgeText = 'DONE';
                    badgeBg = 'rgba(46,160,67,0.2)';
                    badgeColor = '#7ee787';
                } else if (isResearching) {
                    stateClass = 'researching';
                    const pct = Math.floor((player.researchProgress / tech.cost) * 100);
                    badgeText = `${pct}%`;
                    badgeBg = 'rgba(88,166,255,0.2)';
                    badgeColor = '#58a6ff';
                } else if (isAvailable) {
                    stateClass = 'available';
                    badgeText = 'READY';
                    badgeBg = 'rgba(88,166,255,0.15)';
                    badgeColor = '#79c0ff';
                }

                html += `
                    <div class="tech-node ${stateClass}" data-tech-id="${tech.id}" style="border-color:${eraColor}40">
                        <span class="tech-state-badge" style="background:${badgeBg};color:${badgeColor}">${badgeText}</span>
                        <div class="tech-name" style="color:${eraColor}">${tech.name}</div>
                        <div class="tech-cost">${tech.cost} Science</div>
                        <div class="tech-unlocks">${tech.unlocks.join(', ')}</div>
                        ${tech.prerequisites.length > 0
                            ? `<div style="font-size:0.58rem;color:var(--text-dim);margin-top:4px">Requires: ${tech.prerequisites.map(p => techData[p]?.name || p).join(', ')}</div>`
                            : ''}
                    </div>
                `;
            });

            html += '</div></div>';
        });

        html += '</div>';

        this.openModalContent(html, 'TECHNOLOGY TREE');

        // Draw SVG connection lines after rendering
        requestAnimationFrame(() => {
            this.drawTechTreeConnections(player, techData);
        });

        // Bind click handlers
        document.querySelectorAll('.tech-node[data-tech-id]').forEach(node => {
            node.addEventListener('click', () => {
                const techId = node.dataset.techId;
                if (availableIds.has(techId)) {
                    player.currentTech = techData[techId];
                    player.researchProgress = 0;
                    this.notify(`Researching ${techData[techId].name}`, 'research');
                    this.updateHUD(player);
                    this.showTechTree(); // Refresh
                } else if (player.unlockedTechs.has(techId)) {
                    // Already unlocked, do nothing
                } else {
                    this.notify('Prerequisites not met', 'warning');
                }
            });
        });
    }

    drawTechTreeConnections(player, techData) {
        const container = document.getElementById('tech-tree-graph');
        if (!container) return;

        // Remove existing SVG
        const existingSvg = container.querySelector('.tech-tree-svg');
        if (existingSvg) existingSvg.remove();

        const containerRect = container.getBoundingClientRect();
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('tech-tree-svg');
        svg.setAttribute('width', container.scrollWidth);
        svg.setAttribute('height', container.scrollHeight);
        svg.style.width = container.scrollWidth + 'px';
        svg.style.height = container.scrollHeight + 'px';

        Object.values(techData).forEach(tech => {
            tech.prerequisites.forEach(preId => {
                const fromNode = container.querySelector(`[data-tech-id="${preId}"]`);
                const toNode = container.querySelector(`[data-tech-id="${tech.id}"]`);

                if (!fromNode || !toNode) return;

                const fromRect = fromNode.getBoundingClientRect();
                const toRect = toNode.getBoundingClientRect();

                const x1 = fromRect.left + fromRect.width / 2 - containerRect.left + container.scrollLeft;
                const y1 = fromRect.top + fromRect.height - containerRect.top + container.scrollTop;
                const x2 = toRect.left + toRect.width / 2 - containerRect.left + container.scrollLeft;
                const y2 = toRect.top - containerRect.top + container.scrollTop;

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const midY = (y1 + y2) / 2;
                line.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
                line.classList.add('tech-connection-line');

                if (player.unlockedTechs.has(preId) && player.unlockedTechs.has(tech.id)) {
                    line.classList.add('unlocked');
                }

                svg.appendChild(line);
            });
        });

        container.insertBefore(svg, container.firstChild);
    }

    // ========================================================================
    //  DIPLOMACY SCREEN
    // ========================================================================

    showDiplomacyScreen() {
        const player = this.game.getCurrentPlayer();
        const diplomacy = this.game.diplomacy;

        const metCivs = this.game.players.filter(p => p !== player && player.metPlayers.has(p.id));

        if (metCivs.length === 0) {
            this.openModalContent(`
                <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px">
                    <div style="font-size:3rem;opacity:0.3">&#127758;</div>
                    <div style="font-size:1.2rem;font-weight:700;color:var(--text-dim)">No civilizations met yet</div>
                    <div style="font-size:0.85rem;color:var(--text-dim)">Explore the world to encounter other empires</div>
                </div>
            `, 'DIPLOMACY');
            return;
        }

        let html = '<div class="diplo-grid">';

        metCivs.forEach(other => {
            const rel = diplomacy ? diplomacy.getRelationship(player.id, other.id) : { status: 'neutral', opinion: 0, openBorders: false, alliance: false };
            const deals = diplomacy ? diplomacy.deals.filter(d => d.parties.includes(player.id) && d.parties.includes(other.id)) : [];

            // Status styling
            let statusColor, statusBg;
            switch (rel.status) {
                case DiplomaticStatus.WAR:
                    statusColor = '#ff4444'; statusBg = 'rgba(255,68,68,0.15)'; break;
                case DiplomaticStatus.ALLIANCE:
                    statusColor = '#f2cc60'; statusBg = 'rgba(242,204,96,0.15)'; break;
                case DiplomaticStatus.FRIENDLY:
                    statusColor = '#7ee787'; statusBg = 'rgba(126,231,135,0.15)'; break;
                case DiplomaticStatus.HOSTILE:
                    statusColor = '#ff7b72'; statusBg = 'rgba(255,123,114,0.15)'; break;
                default:
                    statusColor = '#79c0ff'; statusBg = 'rgba(121,192,255,0.1)';
            }

            // Opinion bar
            const opinionVal = Math.round(rel.opinion);
            const opinionColor = opinionVal > 0 ? '#7ee787' : opinionVal < 0 ? '#ff7b72' : 'var(--text-dim)';
            const opinionLabel = opinionVal > 20 ? 'Friendly' : opinionVal > 0 ? 'Warm' : opinionVal > -10 ? 'Neutral' : opinionVal > -20 ? 'Unfriendly' : 'Hostile';

            html += `
                <div class="diplo-card" style="border-color:${other.color}30">
                    <div class="diplo-header">
                        <div class="diplo-civ-icon" style="background:${other.color}15;border-color:${other.color};color:${other.color}">
                            ${other.name.charAt(0)}
                        </div>
                        <div>
                            <div class="diplo-civ-name" style="color:${other.color}">${other.name}</div>
                            <div class="diplo-status" style="color:${statusColor};background:${statusBg}">${rel.status.toUpperCase()}</div>
                        </div>
                    </div>

                    <div class="diplo-opinion">
                        Opinion: <span style="color:${opinionColor};font-weight:700">${opinionVal > 0 ? '+' : ''}${opinionVal}</span>
                        <span style="margin-left:6px">(${opinionLabel})</span>
                        ${rel.openBorders ? '<br><span style="color:#7ee787">Open Borders active</span>' : ''}
                        ${rel.alliance ? '<br><span style="color:var(--gold)">Alliance active</span>' : ''}
                    </div>

                    ${deals.length > 0 ? `
                        <div class="diplo-deals">
                            <strong style="font-size:0.68rem">Active Deals:</strong><br>
                            ${deals.map(d => `${d.type}${d.turnsRemaining !== undefined ? ` (${d.turnsRemaining} turns)` : ''}`).join('<br>')}
                        </div>
                    ` : ''}

                    <div class="diplo-actions" data-other-id="${other.id}">
                        ${rel.status === DiplomaticStatus.WAR
                            ? `<button class="diplo-btn peace" data-action="peace" data-other="${other.id}">Propose Peace</button>`
                            : `<button class="diplo-btn war" data-action="war" data-other="${other.id}">Declare War</button>`
                        }
                        ${rel.status !== DiplomaticStatus.WAR && !rel.openBorders
                            ? `<button class="diplo-btn" data-action="open_borders" data-other="${other.id}">Open Borders</button>`
                            : ''}
                        ${rel.status !== DiplomaticStatus.WAR
                            ? `<button class="diplo-btn" data-action="trade_gold" data-other="${other.id}">Trade Gold</button>`
                            : ''}
                        ${rel.status !== DiplomaticStatus.WAR && !rel.alliance
                            ? `<button class="diplo-btn alliance" data-action="alliance" data-other="${other.id}">Propose Alliance</button>`
                            : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';

        this.openModalContent(html, 'DIPLOMACY');

        // Bind action buttons
        document.querySelectorAll('.diplo-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const otherId = parseInt(btn.dataset.other, 10);
                const otherPlayer = this.game.players.find(p => p.id === otherId);
                if (!otherPlayer || !diplomacy) return;

                this.handleDiplomaticAction(player, otherPlayer, action, diplomacy);
            });
        });
    }

    handleDiplomaticAction(player, otherPlayer, action, diplomacy) {
        switch (action) {
            case 'war':
                if (diplomacy.canDeclareWar(player.id, otherPlayer.id)) {
                    diplomacy.declareWar(player, otherPlayer);
                    this.notify(`War declared on ${otherPlayer.name}!`, 'combat');
                    this.showDiplomacyScreen();
                } else {
                    this.notify('Cannot declare war (peace treaty active)', 'warning');
                }
                break;

            case 'peace':
                if (diplomacy.makePeace(player, otherPlayer)) {
                    this.notify(`Peace with ${otherPlayer.name}!`, 'diplomacy');
                    this.showDiplomacyScreen();
                } else {
                    this.notify('Cannot make peace yet (minimum 10 turns at war)', 'warning');
                }
                break;

            case 'open_borders':
                diplomacy.proposeDeal(player, otherPlayer, { type: 'OPEN_BORDERS' });
                this.notify(`Open Borders with ${otherPlayer.name}`, 'diplomacy');
                this.showDiplomacyScreen();
                break;

            case 'trade_gold': {
                const amount = Math.min(50, Math.floor(player.gold * 0.1));
                if (amount < 1) {
                    this.notify('Not enough gold to trade', 'warning');
                    return;
                }
                diplomacy.proposeDeal(player, otherPlayer, { type: 'TRADE_GOLD', amount });
                this.notify(`Sent ${amount} gold to ${otherPlayer.name}`, 'diplomacy');
                this.updateHUD(player);
                this.showDiplomacyScreen();
                break;
            }

            case 'alliance':
                diplomacy.proposeDeal(player, otherPlayer, { type: 'ALLIANCE' });
                this.notify(`Alliance with ${otherPlayer.name}!`, 'diplomacy');
                this.showDiplomacyScreen();
                break;
        }
    }

    // ========================================================================
    //  GOVERNMENT SCREEN
    // ========================================================================

    showGovernmentScreen() {
        const player = this.game.getCurrentPlayer();
        const gov = player.government;
        const current = gov.currentGovernment;
        const available = gov.getAvailableGovernments();

        let html = '<div class="gov-screen">';

        // Current government
        html += `
            <div class="gov-current">
                <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">
                    <span style="font-size:2.2rem">${current.icon || ''}</span>
                    <div>
                        <div class="gov-current-title">${current.name}</div>
                        <div style="font-size:0.8rem;color:var(--text-dim)">${current.description}</div>
                    </div>
                </div>
        `;

        // Bonuses
        if (Object.keys(current.bonuses).length > 0) {
            html += '<div style="margin-top:8px">';
            Object.entries(current.bonuses).forEach(([key, val]) => {
                const formatted = typeof val === 'number' && Math.abs(val) < 1 ? `${val > 0 ? '+' : ''}${(val * 100).toFixed(0)}%` : `${val > 0 ? '+' : ''}${val}`;
                html += `<span style="color:#7ee787;font-size:0.78rem;margin-right:12px">${formatted} ${this.formatBonusKey(key)}</span>`;
            });
            html += '</div>';
        }
        if (current.penalties && Object.keys(current.penalties).length > 0) {
            html += '<div style="margin-top:4px">';
            Object.entries(current.penalties).forEach(([key, val]) => {
                const formatted = typeof val === 'number' && Math.abs(val) < 1 ? `${val > 0 ? '+' : ''}${(val * 100).toFixed(0)}%` : `${val > 0 ? '+' : ''}${val}`;
                html += `<span style="color:#ff7b72;font-size:0.78rem;margin-right:12px">${formatted} ${this.formatBonusKey(key)}</span>`;
            });
            html += '</div>';
        }

        // Anarchy warning
        if (gov.isInAnarchy()) {
            html += `<div style="margin-top:10px;padding:8px;background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.2);border-radius:4px;font-size:0.78rem;color:#ff7b72;font-weight:700">ANARCHY! ${gov.anarchyTurns} turn(s) remaining - all yields reduced by 75%</div>`;
        }

        // Policy slots
        html += `<div class="gov-section-title" style="margin-top:14px">Policy Slots (${gov.activePolicies.length}/${current.slotCount})</div>`;
        html += '<div class="policy-slots">';
        for (let i = 0; i < current.slotCount; i++) {
            const policy = gov.activePolicies[i];
            if (policy) {
                html += `<div class="policy-slot filled" data-policy-index="${i}" title="${policy.description}">${policy.name}</div>`;
            } else {
                html += '<div class="policy-slot">+</div>';
            }
        }
        html += '</div>';

        html += '</div>'; // End gov-current

        // Available governments
        if (available.length > 0) {
            html += '<div class="gov-section-title">Available Governments</div>';
            html += '<div class="gov-grid">';
            available.forEach(g => {
                const govKey = Object.keys(GovernmentType).find(k => GovernmentType[k] === g);
                html += `
                    <div class="gov-card" data-gov-key="${govKey}">
                        <div class="gov-card-name">${g.icon || ''} ${g.name}</div>
                        <div class="gov-card-desc">${g.description}</div>
                        <div style="font-size:0.65rem;color:var(--text-dim);margin-bottom:4px">Era: ${g.era} | Slots: ${g.slotCount}</div>
                        ${Object.keys(g.bonuses).length > 0
                            ? `<div class="gov-card-bonuses">${Object.entries(g.bonuses).map(([k, v]) => {
                                const f = typeof v === 'number' && Math.abs(v) < 1 ? `+${(v * 100).toFixed(0)}%` : `+${v}`;
                                return `${f} ${this.formatBonusKey(k)}`;
                            }).join(', ')}</div>`
                            : ''}
                        ${g.penalties && Object.keys(g.penalties).length > 0
                            ? `<div class="gov-card-penalties">${Object.entries(g.penalties).map(([k, v]) => {
                                const f = typeof v === 'number' && Math.abs(v) < 1 ? `${(v * 100).toFixed(0)}%` : `${v}`;
                                return `${f} ${this.formatBonusKey(k)}`;
                            }).join(', ')}</div>`
                            : ''}
                    </div>
                `;
            });
            html += '</div>';
        }

        // All policies
        html += '<div class="gov-section-title" style="margin-top:20px">Policies</div>';
        html += '<div class="policy-grid">';

        const categories = ['military', 'economic', 'diplomatic', 'cultural'];
        const categoryColors = { military: '#ff7b72', economic: 'var(--gold)', diplomatic: '#79c0ff', cultural: 'var(--culture)' };

        categories.forEach(cat => {
            const policies = Object.entries(PolicyType).filter(([, p]) => p.category === cat);
            policies.forEach(([pKey, policy]) => {
                const isActive = gov.activePolicies.includes(policy);
                html += `
                    <div class="policy-card ${isActive ? 'active' : ''}" data-policy-key="${pKey}">
                        <div class="policy-card-category" style="color:${categoryColors[cat]}">${cat}</div>
                        <div class="policy-card-name">${policy.name}</div>
                        <div class="policy-card-desc">${policy.description}</div>
                        ${isActive ? '<div style="font-size:0.6rem;color:#7ee787;margin-top:4px;font-weight:700">ACTIVE - click to remove</div>' : ''}
                    </div>
                `;
            });
        });

        html += '</div></div>';

        this.openModalContent(html, 'GOVERNMENT');

        // Bind government change
        document.querySelectorAll('.gov-card[data-gov-key]').forEach(card => {
            card.addEventListener('click', () => {
                const govKey = card.dataset.govKey;
                const newGov = GovernmentType[govKey];
                if (newGov && gov.changeGovernment(newGov)) {
                    this.notify(`Switched to ${newGov.name}! (1 turn of anarchy)`, 'diplomacy');
                    this.updateHUD(player);
                    this.showGovernmentScreen();
                }
            });
        });

        // Bind policy toggle
        document.querySelectorAll('.policy-card[data-policy-key]').forEach(card => {
            card.addEventListener('click', () => {
                const pKey = card.dataset.policyKey;
                const policy = PolicyType[pKey];
                if (!policy) return;

                if (gov.activePolicies.includes(policy)) {
                    gov.removePolicy(policy);
                    this.notify(`Removed ${policy.name}`, 'default');
                } else if (gov.canAdoptPolicy(policy)) {
                    gov.adoptPolicy(policy);
                    this.notify(`Adopted ${policy.name}`, 'diplomacy');
                } else {
                    this.notify('No available policy slots', 'warning');
                }
                this.showGovernmentScreen();
            });
        });

        // Bind active policy slot removal
        document.querySelectorAll('.policy-slot.filled').forEach(slot => {
            slot.addEventListener('click', () => {
                const idx = parseInt(slot.dataset.policyIndex, 10);
                const policy = gov.activePolicies[idx];
                if (policy) {
                    gov.removePolicy(policy);
                    this.notify(`Removed ${policy.name}`, 'default');
                    this.showGovernmentScreen();
                }
            });
        });
    }

    formatBonusKey(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    }

    // ========================================================================
    //  DEMOGRAPHICS
    // ========================================================================

    showDemographics() {
        const players = this.game.players;
        const humanPlayer = this.game.getCurrentPlayer();

        // Calculate stats for all players
        const stats = players.map(p => {
            const goldRate = p.cities.reduce((sum, c) => sum + c.calculateYields().gold, 0);
            const scienceRate = p.cities.reduce((sum, c) => sum + c.calculateYields().science, 0);
            const cultureRate = p.cities.reduce((sum, c) => sum + c.calculateYields().culture, 0);
            const totalPop = p.cities.reduce((sum, c) => sum + c.population, 0);
            const military = p.units.reduce((sum, u) => sum + (u.type.strength || 0), 0);

            return {
                player: p,
                score: p.totalScore || p.calculateScore(),
                population: totalPop,
                military: military,
                science: Math.floor(scienceRate),
                gold: Math.floor(p.gold),
                goldRate: Math.floor(goldRate),
                culture: Math.floor(p.totalCulture || 0),
                cultureRate: Math.floor(cultureRate),
                cities: p.cities.length,
                techs: p.unlockedTechs.size
            };
        });

        // Ranking categories
        const categories = [
            { key: 'score',      label: 'Score',       icon: '&#127942;' },
            { key: 'population', label: 'Population',  icon: '&#128100;' },
            { key: 'military',   label: 'Military',    icon: '&#9876;' },
            { key: 'science',    label: 'Science/Turn', icon: '&#128300;' },
            { key: 'gold',       label: 'Treasury',    icon: '&#128176;' },
            { key: 'culture',    label: 'Culture',     icon: '&#127912;' },
            { key: 'cities',     label: 'Cities',      icon: '&#127984;' },
            { key: 'techs',      label: 'Technologies', icon: '&#128218;' }
        ];

        let html = `<table class="demo-table">
            <thead><tr>
                <th>Rank</th>
                <th>Civilization</th>
                ${categories.map(c => `<th title="${c.label}">${c.icon} ${c.label}</th>`).join('')}
            </tr></thead>
            <tbody>
        `;

        // Sort by score for ranking
        const sorted = [...stats].sort((a, b) => b.score - a.score);

        sorted.forEach((s, idx) => {
            const isHuman = s.player === humanPlayer;
            const known = isHuman || humanPlayer.metPlayers.has(s.player.id);
            const rowClass = isHuman ? 'player-row' : '';

            html += `<tr class="${rowClass}">
                <td><span class="demo-rank">#${idx + 1}</span></td>
                <td style="color:${s.player.color};font-weight:700">${known ? s.player.name : '???'}</td>
                ${categories.map(c => {
                    const val = s[c.key];
                    const display = known || isHuman ? val : '?';
                    // Highlight leader in each category
                    const max = Math.max(...stats.map(st => st[c.key]));
                    const isLeader = val === max && val > 0;
                    return `<td style="${isLeader ? 'color:var(--gold);font-weight:700' : ''}">${display}</td>`;
                }).join('')}
            </tr>`;
        });

        html += '</tbody></table>';

        this.openModalContent(html, 'DEMOGRAPHICS');
    }

    // ========================================================================
    //  HELP SCREEN
    // ========================================================================

    showHelp() {
        const content = `
            <div class="help-grid">
                <div>
                    <div class="help-section">
                        <h3 style="color:var(--gold)">Founding Your Empire</h3>
                        <p>Move your <b>SETTLER</b> to a fertile spot (Grasslands/Plains near rivers) and click <b>SETTLE</b>. Rivers provide +1 Food bonus. City borders grow with culture.</p>
                    </div>

                    <div class="help-section">
                        <h3 style="color:var(--production)">Workers & Improvements</h3>
                        <p>Build Workers in cities to improve tiles:</p>
                        <ul style="margin-left:20px">
                            <li><b>FARM</b> - Food on flat land</li>
                            <li><b>MINE</b> - Production on hills</li>
                            <li><b>PASTURE</b> - Food+Production on livestock</li>
                            <li><b>HARVEST</b> - Instantly collect 150 Gold from a resource</li>
                        </ul>
                        <p style="margin-top:8px"><b>Shift+Click</b> a production option to rush-buy with gold.</p>
                    </div>

                    <div class="help-section">
                        <h3 style="color:var(--science)">Research & Technology</h3>
                        <p>Click the research tracker or press <span class="help-kbd">T</span> to open the Tech Tree. Technologies unlock buildings, units, and wonders.</p>
                    </div>

                    <div class="help-section">
                        <h3 style="color:var(--culture)">Government & Policies</h3>
                        <p>Press <span class="help-kbd">G</span> to manage your government. Different governments provide different bonuses and policy slots.</p>
                    </div>
                </div>

                <div>
                    <div class="help-section">
                        <h3 style="color:#ff7b72">Combat & Defense</h3>
                        <p>Military units can attack enemies in adjacent tiles. Ranged units attack from distance. Fortified units get +50% defense. Units gain XP and can be promoted.</p>
                    </div>

                    <div class="help-section">
                        <h3 style="color:var(--accent-color)">Keyboard Shortcuts</h3>
                        <table style="width:100%;font-size:0.85rem">
                            <tr><td><span class="help-kbd">Space</span></td><td>End Turn / Next Unit</td></tr>
                            <tr><td><span class="help-kbd">N</span></td><td>Next unit with moves</td></tr>
                            <tr><td><span class="help-kbd">F</span></td><td>Fortify selected unit</td></tr>
                            <tr><td><span class="help-kbd">S</span></td><td>Skip unit turn</td></tr>
                            <tr><td><span class="help-kbd">T</span></td><td>Tech Tree</td></tr>
                            <tr><td><span class="help-kbd">D</span></td><td>Diplomacy</td></tr>
                            <tr><td><span class="help-kbd">G</span></td><td>Government</td></tr>
                            <tr><td><span class="help-kbd">Tab</span></td><td>Cycle units</td></tr>
                            <tr><td><span class="help-kbd">Esc</span></td><td>Close modal</td></tr>
                        </table>
                    </div>

                    <div class="help-section">
                        <h3 style="color:white;background:rgba(255,255,255,0.05);padding:12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1)">Pro Tips</h3>
                        <ul style="margin-left:20px;font-size:0.88rem">
                            <li>Settle near rivers for the Food bonus</li>
                            <li>Build Libraries early for faster research</li>
                            <li>Keep at least 1 military unit per city</li>
                            <li>Promote units for powerful combat bonuses</li>
                            <li>Golden Ages boost all Gold and Production</li>
                        </ul>
                    </div>

                    <button class="premium-btn primary" onclick="document.getElementById('modal-overlay').classList.add('hidden')" style="width:100%;height:54px;font-size:1.1rem;margin-top:16px;cursor:pointer">RESUME GAME</button>
                </div>
            </div>
        `;
        this.openModalContent(content, 'CIVILOPEDIA');
    }

    // ========================================================================
    //  VICTORY MODAL
    // ========================================================================

    showVictoryModal(player, type) {
        const victoryNames = {
            SCIENCE:    'Science Victory',
            SCORE:      'Score Victory',
            DOMINATION: 'Domination Victory',
            CULTURE:    'Cultural Victory'
        };

        const players = this.game.players.map(p => ({
            name: p.name,
            score: p.totalScore || this.game.getScore(p),
            color: p.color,
            isWinner: p === player
        })).sort((a, b) => b.score - a.score);

        let scoreboard = players.map((p, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;${p.isWinner ? 'background:rgba(242,204,96,0.1);border-radius:6px;border:1px solid rgba(242,204,96,0.2)' : ''}">
                <span style="color:${p.color};font-weight:700">${i === 0 ? '&#127942; ' : ''}${p.name}</span>
                <span style="color:var(--gold);font-weight:800">${Math.round(p.score)}</span>
            </div>
        `).join('');

        const content = `
            <div style="text-align:center;padding:2.5rem;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
                <div style="font-size:4rem;margin-bottom:8px;animation:titleGlow 3s ease-in-out infinite alternate">&#127942;</div>
                <h1 style="font-size:2.8rem;margin-bottom:0.5rem;color:var(--gold);border:none;letter-spacing:4px">${victoryNames[type] || type}</h1>
                <p style="font-size:1.3rem;margin-bottom:2rem;color:var(--text-dim)">${player.name} achieves glory!</p>

                <div style="width:100%;max-width:450px;margin-bottom:2rem">
                    <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:10px;text-align:left">Final Standings</div>
                    ${scoreboard}
                </div>

                <div class="glass-panel" style="display:inline-block;padding:1.5rem 2.5rem;border-radius:10px;margin-bottom:2rem">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 30px;text-align:left;font-size:0.9rem">
                        <div><span style="color:var(--text-dim)">Cities:</span> ${player.cities.length}</div>
                        <div><span style="color:var(--text-dim)">Units:</span> ${player.units.length}</div>
                        <div><span style="color:var(--text-dim)">Techs:</span> ${player.unlockedTechs.size}</div>
                        <div><span style="color:var(--text-dim)">Turn:</span> ${this.game.turn}</div>
                    </div>
                </div>

                <button class="premium-btn primary" onclick="location.reload()" style="padding:14px 40px;font-size:1.1rem;cursor:pointer">NEW GAME</button>
            </div>
        `;
        this.openModalContent(content, 'GAME OVER');
    }

    // ========================================================================
    //  FIRST CONTACT DIPLOMACY
    // ========================================================================

    showDiplomacy(otherPlayer) {
        const quotes = [
            `Greetings, traveler. I am the leader of the ${otherPlayer.name}. We seek only peace and prosperity in these lands.`,
            `At last we meet. The ${otherPlayer.name} has watched your expansion with great interest.`,
            `You stand before the might of the ${otherPlayer.name}. Choose your next words wisely.`,
            `Welcome, neighbor. The ${otherPlayer.name} proposes friendship between our peoples.`
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        const content = `
            <div style="text-align:center;padding:3rem;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center">
                <div class="diplo-civ-icon" style="width:80px;height:80px;font-size:2.5rem;border-color:${otherPlayer.color};color:${otherPlayer.color};background:${otherPlayer.color}15;margin-bottom:20px">
                    ${otherPlayer.name.charAt(0)}
                </div>
                <h1 style="font-size:2.8rem;color:${otherPlayer.color};text-shadow:0 0 30px ${otherPlayer.color}44;border:none;margin-bottom:0">${otherPlayer.name.toUpperCase()}</h1>
                <p style="font-size:1rem;color:var(--text-dim);margin-bottom:2.5rem">A new civilization has been discovered</p>

                <div style="font-style:italic;font-size:1.2rem;max-width:550px;margin-bottom:3rem;position:relative;padding:1.5rem;line-height:1.6">
                    <span style="font-size:3rem;position:absolute;left:-15px;top:-8px;opacity:0.15">"</span>
                    ${quote}
                    <span style="font-size:3rem;position:absolute;right:-8px;bottom:-30px;opacity:0.15">"</span>
                </div>

                <div style="display:flex;gap:1.5rem">
                    <button class="premium-btn primary" id="diplo-peace-btn" style="padding:12px 28px;font-size:1rem">WE SEEK PEACE</button>
                    <button class="premium-btn" id="diplo-threat-btn" style="padding:12px 28px;font-size:1rem;border-color:#ff7b72;color:#ff7b72">PREPARE FOR WAR</button>
                </div>
            </div>
        `;
        this.openModalContent(content, 'DIPLOMATIC ENCOUNTER');

        document.getElementById('diplo-peace-btn')?.addEventListener('click', () => {
            if (this.game.diplomacy) {
                const rel = this.game.diplomacy.getRelationship(this.game.getCurrentPlayer().id, otherPlayer.id);
                rel.opinion += 10;
                rel.status = DiplomaticStatus.FRIENDLY;
            }
            this.notify(`Established peaceful relations with ${otherPlayer.name}`, 'diplomacy');
            this.closeModal();
        });

        document.getElementById('diplo-threat-btn')?.addEventListener('click', () => {
            if (this.game.diplomacy) {
                const rel = this.game.diplomacy.getRelationship(this.game.getCurrentPlayer().id, otherPlayer.id);
                rel.opinion -= 15;
                rel.status = DiplomaticStatus.HOSTILE;
            }
            this.notify(`${otherPlayer.name} takes note of your hostility`, 'combat');
            this.closeModal();
        });
    }

    // ========================================================================
    //  TOOLTIP
    // ========================================================================

    showTooltip(content, x, y) {
        let el = document.getElementById('tooltip');
        if (!el) {
            el = document.createElement('div');
            el.id = 'tooltip';
            el.className = 'glass-panel';
            document.body.appendChild(el);
        }
        el.style.display = 'block';
        el.innerHTML = content;

        const width = 200;
        const height = 120;
        const offset = 18;

        let fx = x + offset;
        let fy = y + offset;
        if (fx + width > window.innerWidth) fx = x - width - offset;
        if (fy + height > window.innerHeight) fy = y - height - offset;

        el.style.left = `${fx}px`;
        el.style.top = `${fy}px`;
    }

    hideTooltip() {
        const el = document.getElementById('tooltip');
        if (el) el.style.display = 'none';
    }

    // ========================================================================
    //  MODAL HELPERS
    // ========================================================================

    openModalContent(content, title = 'CIVILOPEDIA') {
        const modal = document.getElementById('modal-overlay');
        const body = document.getElementById('modal-content-body');
        const headerEl = document.querySelector('.modal header h2');

        if (headerEl) headerEl.textContent = title;
        modal.classList.remove('hidden');
        body.className = '';
        body.innerHTML = content;
    }

    closeModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) modal.classList.add('hidden');
    }

    showRenameModal(city) {
        const content = `
            <div style="padding:40px;text-align:center">
                <input type="text" id="city-rename-input" class="rename-input" value="${city.name}" autofocus>
                <div style="display:flex;gap:20px;margin-top:10px">
                    <button class="premium-btn primary" id="save-rename-btn" style="flex:1;height:50px">SAVE</button>
                    <button class="premium-btn" onclick="document.getElementById('modal-overlay').classList.add('hidden')" style="flex:1">CANCEL</button>
                </div>
            </div>
        `;
        this.openModalContent(content, 'RENAME CITY');

        const input = document.getElementById('city-rename-input');
        if (input) {
            input.select();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') document.getElementById('save-rename-btn')?.click();
            };
        }

        document.getElementById('save-rename-btn')?.addEventListener('click', () => {
            const newName = input.value.trim();
            if (newName) {
                city.rename(newName);
                this.updateCityList(city.owner);
                this.showSelection(city);
                this.notify(`City renamed to ${newName}`, 'production');
                this.closeModal();
            }
        });
    }

    // ========================================================================
    //  KEYBOARD SHORTCUT HANDLERS
    // ========================================================================

    selectNextUnitWithMoves() {
        const player = this.game.getCurrentPlayer();
        const readyUnits = player.units.filter(u => u.movementPoints > 0 && u.task === 'Ready');
        if (readyUnits.length === 0) return;

        // Find next unit after current selection
        let startIdx = 0;
        if (this.game.selectedEntity && this.game.selectedEntity.type && this.game.selectedEntity.type.name) {
            const currentIdx = readyUnits.indexOf(this.game.selectedEntity);
            if (currentIdx >= 0) startIdx = (currentIdx + 1) % readyUnits.length;
        }

        const unit = readyUnits[startIdx];
        this.game.selectedEntity = unit;
        this.game.centerOn(unit);

        const { Pathfinding } = window.game.constructor.prototype.constructor.length
            ? { Pathfinding: null }
            : { Pathfinding: null };

        // Recalculate reachable tiles
        try {
            const tile = this.game.worldMap.getTile(unit.q, unit.r);
            if (tile && window.Pathfinding) {
                this.game.reachableTiles = window.Pathfinding.getReachableTiles(tile, this.game.worldMap, unit.movementPoints);
            } else {
                this.game.reachableTiles = new Map();
            }
        } catch {
            this.game.reachableTiles = new Map();
        }

        this.showSelection(unit);
    }

    cycleUnits() {
        const player = this.game.getCurrentPlayer();
        if (player.units.length === 0) return;

        this.selectedUnitIndex = (this.selectedUnitIndex + 1) % player.units.length;
        const unit = player.units[this.selectedUnitIndex];

        this.game.selectedEntity = unit;
        this.game.centerOn(unit);
        this.game.reachableTiles = new Map();
        this.showSelection(unit);
    }

    shortcutFortify() {
        const entity = this.game.selectedEntity;
        if (entity && entity.type && entity.type.actions?.includes('Fortify')) {
            this.game.handleAction(entity, 'Fortify');
        }
    }

    shortcutSkipTurn() {
        const entity = this.game.selectedEntity;
        if (entity && entity.type && entity.type.actions?.includes('Skip Turn')) {
            this.game.handleAction(entity, 'Skip Turn');
        }
    }

    // ========================================================================
    //  SAVE / LOAD
    // ========================================================================

    ensureSaveLoadButtons() {
        if (document.getElementById('save-load-menu')) return;

        const turnGroup = document.querySelector('.turn-group');
        if (!turnGroup) return;

        const menu = document.createElement('div');
        menu.id = 'save-load-menu';
        menu.className = 'save-menu';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-menu-btn';
        saveBtn.textContent = 'SAVE';
        saveBtn.onclick = () => this.saveGame();

        const loadBtn = document.createElement('button');
        loadBtn.className = 'save-menu-btn';
        loadBtn.textContent = 'LOAD';
        loadBtn.onclick = () => this.loadGame();

        menu.appendChild(saveBtn);
        menu.appendChild(loadBtn);

        // Insert before the end turn button
        const endBtn = document.getElementById('end-turn-btn');
        if (endBtn) {
            turnGroup.insertBefore(menu, endBtn);
        } else {
            turnGroup.appendChild(menu);
        }
    }

    saveGame(isAutoSave = false) {
        try {
            const player = this.game.getCurrentPlayer();
            const state = {
                turn: this.game.turn,
                timestamp: Date.now(),
                playerName: player.name,
                playerGold: player.gold,
                playerScience: player.science,
                playerHappiness: player.happiness,
                playerCulture: player.culture,
                playerTotalCulture: player.totalCulture,
                playerEra: player.currentEra,
                playerCities: player.cities.length,
                playerUnits: player.units.length,
                playerTechs: Array.from(player.unlockedTechs),
                currentTechId: player.currentTech?.id || null,
                researchProgress: player.researchProgress,
                version: 1
            };

            const key = isAutoSave ? AUTOSAVE_KEY : SAVE_KEY;
            localStorage.setItem(key, JSON.stringify(state));

            if (!isAutoSave) {
                this.notify('Game saved!', 'production');
            }
        } catch (err) {
            this.notify('Save failed: ' + err.message, 'error');
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(AUTOSAVE_KEY);
            if (!raw) {
                this.notify('No save found', 'warning');
                return;
            }

            const state = JSON.parse(raw);
            const date = new Date(state.timestamp);
            const timeStr = date.toLocaleString();

            const content = `
                <div style="padding:40px;text-align:center">
                    <h2 style="margin-bottom:20px;border:none">Load Save?</h2>
                    <div class="glass-panel" style="display:inline-block;padding:20px 30px;border-radius:8px;margin-bottom:24px;text-align:left">
                        <div style="font-size:0.85rem;margin-bottom:6px"><span style="color:var(--text-dim)">Saved:</span> ${timeStr}</div>
                        <div style="font-size:0.85rem;margin-bottom:6px"><span style="color:var(--text-dim)">Turn:</span> ${state.turn}</div>
                        <div style="font-size:0.85rem;margin-bottom:6px"><span style="color:var(--text-dim)">Era:</span> ${state.playerEra}</div>
                        <div style="font-size:0.85rem;margin-bottom:6px"><span style="color:var(--text-dim)">Cities:</span> ${state.playerCities}</div>
                        <div style="font-size:0.85rem"><span style="color:var(--text-dim)">Techs:</span> ${state.playerTechs.length}</div>
                    </div>
                    <div style="display:flex;gap:16px;justify-content:center">
                        <button class="premium-btn primary" id="confirm-load-btn" style="padding:12px 30px">LOAD GAME</button>
                        <button class="premium-btn" onclick="document.getElementById('modal-overlay').classList.add('hidden')" style="padding:12px 30px">CANCEL</button>
                    </div>
                    <p style="font-size:0.72rem;color:var(--text-dim);margin-top:16px">Note: Full game state restoration requires a page reload. Partial state (techs, gold) will be applied.</p>
                </div>
            `;
            this.openModalContent(content, 'LOAD GAME');

            document.getElementById('confirm-load-btn')?.addEventListener('click', () => {
                this.applyLoadedState(state);
                this.closeModal();
            });
        } catch (err) {
            this.notify('Load failed: ' + err.message, 'error');
        }
    }

    applyLoadedState(state) {
        try {
            const player = this.game.getCurrentPlayer();
            player.gold = state.playerGold;
            player.science = state.playerScience;
            player.happiness = state.playerHappiness;
            player.culture = state.playerCulture;
            player.totalCulture = state.playerTotalCulture || 0;
            player.currentEra = state.playerEra;

            // Restore techs
            player.unlockedTechs.clear();
            state.playerTechs.forEach(t => player.unlockedTechs.add(t));

            // Restore current research
            if (state.currentTechId && TechnologyData[state.currentTechId]) {
                player.currentTech = TechnologyData[state.currentTechId];
                player.researchProgress = state.researchProgress || 0;
            }

            this.game.turn = state.turn;
            this.updateHUD(player);
            this.notify('Game state loaded!', 'production');
        } catch (err) {
            this.notify('Failed to apply save: ' + err.message, 'error');
        }
    }

    checkAutoSave() {
        if (this.game.turn > 0 && this.game.turn % 10 === 0) {
            // Only auto-save once per turn boundary
            if (this._lastAutoSaveTurn !== this.game.turn) {
                this._lastAutoSaveTurn = this.game.turn;
                this.saveGame(true);
            }
        }
    }
}
