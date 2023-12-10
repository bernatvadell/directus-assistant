import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './module.vue';

export default defineModule({
	id: 'assistant',
	name: 'Assistant Chat',
	icon: 'support_agent',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
});
