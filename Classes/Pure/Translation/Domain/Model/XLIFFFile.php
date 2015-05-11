<?php

namespace Pure\Translation\Domain\Model;

class XLIFFFile {

  const XPATH_TARGET_QUERY = '//xliff:trans-unit[@id=\'%s\']/xliff:target';

  /**
   * @var \DOMDocument
   */
  protected $document;

  /**
   * @var string
   */
  protected $fileName;

  /**
   * @var \DOMXpath
   */
  protected $xpath;

  /**
   * @var array
   */
  protected $intermediateValueCache = array();

  public function __construct(\DOMDocument $document, $fileName) {
    $this->document = $document;
    $this->fileName = $fileName;
    $this->xpath = new \DOMXpath($this->document);
    $this->xpath->registerNamespace('xliff', 'urn:oasis:names:tc:xliff:document:1.2');
  }

  /**
   * Get the document
   *
   * @return \DOMDocument
   */
  public function getDocument() {
    return $this->document;
  }

  /**
   * Get the file name
   *
   * @return string
   */
  public function getFileName() {
    return $this->fileName;
  }

  /**
   * Get the string for a given translation id
   *
   * @param string $id
   * @return string
   */
  public function get($id) {
    if (!isset($this->intermediateValueCache[$id])) {
      $element = $this->xpath->query(sprintf(self::XPATH_TARGET_QUERY, $id));

      if (!is_null($element)) {
        foreach ($element as $el) {
          return ($this->intermediateValueCache[$id] = $el->nodeValue);
        }
      }

      $this->intermediateValueCache[$id] = '';
    }

    return $this->intermediateValueCache[$id];
  }

  /**
   * Set the string for a given translation id
   *
   * @param string $id
   * @param string $value
   * @return \Pure\Translation\Domain\Model\XLIFFFile
   */
  public function set($id, $value) {
    $element = $this->xpath->query(sprintf(self::XPATH_TARGET_QUERY, $id));

    if (!is_null($element->item(0))) {
      foreach ($element as $el) {
        $this->intermediateValueCache[$id] = $el->nodeValue = $value;
        break;
      }
    } else {
      $transUnit = $this->document->createElement('trans-unit');
      $transUnit->setAttribute('id', $id);

      $target = $this->document->createElement('target', $value);
      $transUnit->appendChild($target);

      $this->document->getElementsByTagName('body')->item(0)->appendChild($transUnit);
    }

    return $this;
  }

}
