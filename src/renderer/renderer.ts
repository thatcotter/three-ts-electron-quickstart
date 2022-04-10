import './style.css';
import * as THREE from 'three';
import { Raycaster, ShaderMaterial, Shading, Vector2 } from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as DAT from 'dat.gui';

import vertexShader from './assets/shaders/shader.vert';
import fragmentShader from './assets/shaders/shader.frag';

import { ViewOne } from './Views/ViewOne';
import { BaseView } from './Views/BaseView';
import { ViewTwo } from './Views/ViewTwo';

let model = {
	groupX: 0,
	groupY: 0,
	groupAngle: 0,
	activeView: 0,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
}

let renderer: THREE.WebGLRenderer;
let clock = new THREE.Clock();
let controls: DragControls;
let stats: any;
let raycaster: THREE.Raycaster;
let pointerPosition: THREE.Vector2;
let viewOne: ViewOne;
let viewTwo: ViewTwo;
let views: BaseView[] = [];
let shaderMat: ShaderMaterial;

function main() {
    // loadShaders()
	initScene();
	initStats();
	initGUI();
	initListeners();
}

function initStats() {
	stats = new (Stats as any)();
	document.body.appendChild(stats.dom);
}

function initGUI() {
	const gui = new DAT.GUI();
	gui.add(model, 'groupX', -4, 4, 0.1)
	gui.add(model, 'groupY', -3, 3, 0.1)
	gui.add(model, 'groupAngle', -Math.PI, Math.PI, 0.1).listen()
}

function initScene() {

	renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);

	viewOne = new ViewOne(model, renderer);
	views.push(viewOne);

	viewOne.scene.background = new THREE.Color(0xffffff)

	viewTwo = new ViewTwo(model, renderer);
	views.push(viewTwo);

	// controls = new OrbitControls(camera, renderer.domElement);

	raycaster = new THREE.Raycaster();
	pointerPosition = new THREE.Vector2(0,0);

	const uniforms = {
		u_time: { type: 'f', value: 1.0 },
		u_resolution: { type: 'v2', value: new THREE.Vector2(800, 800) },
		// u_mouse: { type: 'v2', value: new THREE.Vector2() },
	};

	shaderMat = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
	});

	// Init animation
	animate();
}

function initListeners() {

	window.electronAPI.handleBackground((event:any, value:any) => {
		console.log(event)
		console.log(value)
		viewTwo.scene.background = new THREE.Color(value)
	})

	window.electronAPI.updatePositionX((event: any, value: any) => {
		console.log(event)
		console.log(value)
		model.groupAngle = value * -Math.PI;
	})

	window.addEventListener('resize', onWindowResize, false);

	window.addEventListener('pointermove', onPointerMove);

	window.addEventListener('keydown', (event) => {
		const { key } = event;
		// console.log(key);

		switch (key) {
			case 'e':
				const win = window.open('', 'Canvas Image');

				const { domElement } = renderer;

				// Makse sure scene is rendered.
                switch (model.activeView) {
                    case 0:
                        renderer.render(viewOne.scene, viewOne.camera);
                        break;
            
                    case 1:
                        renderer.render(viewTwo.scene, viewTwo.camera);
                        break;
            
                    default:
                        break;
                }

				const src = domElement.toDataURL();

				if (!win) return;

				win.document.write(`<img src='${src}' width='${domElement.width}' height='${domElement.height}'>`);
				break;

			case 'ArrowRight':
				model.activeView = (model.activeView + 1) % views.length
				break;

			case 'ArrowLeft':
				model.activeView = (model.activeView - 1)
				if (model.activeView < 0) {
					model.activeView = views.length - 1;
				}
				break;

			default:
				break;
		}
	});
}

function onWindowResize() {
	viewOne.onWindowResize();
}

function onPointerMove(event: any) {
	pointerPosition.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointerPosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
}


function animate() {
	requestAnimationFrame(() => {
		animate();
	});

	let delta = clock.getDelta();

	switch (model.activeView) {
		case 0:
			viewOne.update(clock,delta);
			// if(model.groupAngle < 0) {
			// 	window.electronAPI.writeLEDStatus(0)
			// } else {
			// 	window.electronAPI.writeLEDStatus(1)
			// }
			window.electronAPI.writeLEDBrightness((model.groupAngle + Math.PI) / (Math.PI*2))
			break;

		case 1:
			viewTwo.update(clock,delta);
			break;

		default:
			break;
	}


	if (stats) stats.update();

	// if (controls) controls.update();

	renderer.render(views[model.activeView].scene, views[model.activeView].camera);
}

main();


interface MeshObj extends THREE.Object3D<THREE.Event> {
	material: THREE.MeshPhongMaterial;
}

interface gltfMesh extends THREE.Object3D<THREE.Event> {
	material: THREE.Material;
}

interface ColorMaterial extends THREE.Material {
	color: THREE.Color;
}

export interface IElectronAPI {
	handleBackground: (callback: (event: any, value: any) => void) => void;
	updatePositionX: (callback: (event:any, value:any) => void) => void,
	writeLEDStatus: (onOff:1|0) => any
	writeLEDBrightness: (brightness: number) => any
}

declare global {
	interface Window {
		electronAPI: IElectronAPI;
	}
}