<?php

namespace Pure\Translation\Domain\Factory;

use TYPO3\Flow\Annotations as Flow;

/**
 * @Flow\Scope("singleton")
 */
class XLIFFFileFactory {

  /**
   * Create from an XLIFF file
   *
   * @param string $fileName
   * @return \Pure\Translation\Domain\Model\XLIFFFile
   */
  public function createFromFile($fileName) {
    $document = new \DOMDocument('1.0', 'UTF-8');
    $document->load($fileName);

    return new \Pure\Translation\Domain\Model\XLIFFFile($document, $fileName);
  }

}
