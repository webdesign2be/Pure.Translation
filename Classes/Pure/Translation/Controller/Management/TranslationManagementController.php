<?php
namespace Pure\Translation\Controller\Management;

use TYPO3\Flow\Annotations as Flow;
use TYPO3\Flow\I18n\Exception\InvalidLocaleIdentifierException;
use TYPO3\Flow\I18n\Locale;
use TYPO3\Flow\I18n\Translator;
use TYPO3\Neos\Service\XliffService;
use TYPO3\Flow\Package\PackageManagerInterface;

class TranslationManagementController extends \TYPO3\Neos\Controller\Module\AbstractModuleController {

	/**
	 * @Flow\Inject
	 * @var Translator
	 */
	protected $translator;

	/**
	 * @Flow\Inject
	 * @var PackageManagerInterface
	 */
	protected $packageManager;

	/**
	 * @var array
	 */
	protected $settings;

	/**
	 * @Flow\InjectConfiguration(package="TYPO3.TYPO3CR", path="contentDimensions.language.presets")
	 * @var array
	 */
	protected $languageDimensionPresets;

	/**
	 * @var string
	 */
	protected $currentlyUsedLanguageCode;

	/**
	 * @var Locale
	 */
	protected $currentlyUsedLocale;

	/**
	 * @Flow\Inject
	 * @var \TYPO3\Neos\Service\XliffService
	 */
	protected $xliffService;

	/**
	 * @var array
	 */
	protected $defaultOptions;

	/**
	 * Inject package settings
	 *
	 * @param array $settings
	 * @return void
	 */
	public function injectSettings(array $settings) {
		$this->settings = $settings;
	}

	/**
	 * @return void
	 */
	public function indexAction() {
		$translations = array();
		$packages = $this->packageManager->getFilteredPackages('available', NULL, 'typo3-flow-site');

		foreach ($packages as $key => $package) {
			foreach ($this->languageDimensionPresets as $presetIdentifier => $preset) {
				if (!is_array($preset) || !is_array($preset['values'])) {
					continue;
				}

				$this->currentlyUsedLanguageCode = $preset['values'][0];
				$this->currentlyUsedLocale = new Locale($this->currentlyUsedLanguageCode);
				$xliffData = json_decode($this->xliffService->getCachedJson($this->currentlyUsedLocale, 'Main', $package->getPackageKey()), true);
				foreach ($xliffData as $removedVendor) {
					foreach ($removedVendor as $removedPackage) {
						foreach ($removedPackage as $trans) {
							foreach ($trans as $cat) {
								$translations[$this->currentlyUsedLanguageCode] = $trans;
							}
						}
					}
				}
			}
		}

		$this->view->assign('translations', $translations);
	}
}
